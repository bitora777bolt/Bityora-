import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserAccountStatus,
  RiskLevel,
  GameSessionStatus,
  Transaction,
  GameRecord,
  DepositRequest,
  AdminAuditLog,
  GameType,
  PendingDeposit,
  DailyCheckInState,
  DailySpinState,
  DailySpinSegment,
  PaymentMethodType,
  PaymentMethodConfig,
} from '../types';
import { sounds } from '../utils/soundEffects';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import {
  getDailyCheckInState,
  claimDailyCheckInReward,
  getTodayDateKey,
} from '../utils/dailyCheckIn';
import { getUserDailySpinState } from '../utils/dailySpin';
import { DEFAULT_PAYMENT_METHOD_CONFIGS } from '../utils/upiDeposit';

interface GameContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  transactions: Transaction[];
  gameHistory: GameRecord[];
  depositRequests: DepositRequest[];
  auditLogs: AdminAuditLog[];
  soundEnabled: boolean;
  toggleSound: () => void;
  totalWinnings: number;
  winningsBalance: number;
  // Auth
  loginAs: (userId: string) => void;
  loginWithCredentials: (identifier: string, role?: 'player' | 'admin') => boolean;
  registerUser: (username: string, email: string, phone: string) => User;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  // Credits & Winnings Balance
  topUpVirtualCredits: (amount: number) => { success: boolean; message: string };
  submitDeposit: (amount: number, method?: string, referenceNo?: string) => { success: boolean; message: string; pendingDeposit?: PendingDeposit };
  submitWithdrawal: (amount: number, destination: string) => { success: boolean; message: string };
  instantRefillCredits: (amount?: number) => void;
  depositHistory: Transaction[];
  withdrawalHistory: Transaction[];
  recordGameRound: (game: GameType, gameName: string, wager: number, multiplier: number, payout: number, details?: string) => boolean;
  // 10-Minute Deposit Tracking
  pendingDeposits: PendingDeposit[];
  activePendingDeposit: PendingDeposit | null;
  depositClearanceNotification: string | null;
  dismissDepositClearanceNotification: () => void;
  adminFastForwardDeposit: (depositId: string) => void;
  // Admin Actions & Sovereign Authority
  adminGrantCredits: (targetUserId: string, amount: number, reason: string) => { success: boolean; message: string };
  adminDeductCredits: (targetUserId: string, amount: number, reason: string) => { success: boolean; message: string };
  adminToggleSuspension: (targetUserId: string, reason: string) => void;
  adminSetAccountStatus: (
    targetUserId: string,
    newStatus: UserAccountStatus,
    reason: string,
    policyViolationType?: string,
    suspensionHours?: number
  ) => { success: boolean; message: string };
  adminFlagIllicitBehavior: (
    targetUserId: string,
    flag: string,
    reason: string
  ) => { success: boolean; message: string };
  canUserPlay: (user?: User | null) => { allowed: boolean; reason?: string; status: UserAccountStatus };
  canUserTransact: (user?: User | null) => { allowed: boolean; reason?: string; status: UserAccountStatus };
  trackUserGameSession: (userId: string, gameName: string, status: GameSessionStatus) => void;
  // Deposit Request & Manual UPI Flow
  submitDepositRequest: (
    dataOrAmount:
      | number
      | {
          amount: number;
          utr: string;
          screenshotUrl: string;
          playerId?: string;
          paymentMethod?: PaymentMethodType;
          screenshotName?: string;
          screenshotSize?: string;
        },
    referenceNo?: string,
    qrUrl?: string
  ) => DepositRequest;
  adminProcessDepositRequest: (requestId: string, action: 'APPROVE' | 'REJECT', reason?: string) => void;
  // Multi-Method Deposit QR Configs (Google Pay, PhonePe, Paytm)
  paymentMethodConfigs: Record<PaymentMethodType, PaymentMethodConfig>;
  updateMethodPaymentQr: (
    method: PaymentMethodType,
    photoUrl: string,
    upiId?: string,
    payeeName?: string,
    instructions?: string
  ) => boolean;
  // Deposit QR / Payment Photo (Legacy/Fallback)
  ownerPaymentQr: string;
  ownerUpiId: string;
  ownerPayeeName: string;
  updateOwnerPaymentQr: (photoUrl: string, upiId?: string, payeeName?: string) => boolean;
  // Reset
  resetDemoData: () => void;
  // First-Time Visitor Welcome Guarantee (₹100 Guaranteed Profit on First Game)
  hasClaimedFirstGameBonus: boolean;
  firstGameBonusNotification: string | null;
  dismissFirstGameBonusNotification: () => void;
  // Firebase Google Auth & 110 Credits Welcome Bonus
  welcomeBonusNotification: string | null;
  dismissWelcomeBonusNotification: () => void;
  hasClaimedWelcomeBonus: boolean;
  loginWithFirebaseGoogle: (firebaseUser: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  }) => Promise<{ isNewBonus: boolean; bonusAmount: number; user: User }>;
  phoneBonusNotification: string | null;
  dismissPhoneBonusNotification: () => void;
  hasClaimedPhoneBonus: boolean;
  loginWithFirebasePhone: (phoneNumber: string, firebaseUid: string) => Promise<{ isNewBonus: boolean; bonusAmount: number; user: User }>;
  // 7-Day Cyclical Daily Check-In Rewards
  dailyCheckInState: DailyCheckInState;
  claimDailyCheckIn: () => { success: boolean; amount: number; day: number; message: string };
  isCheckInModalOpen: boolean;
  setIsCheckInModalOpen: (open: boolean) => void;
  openDailyCheckIn: () => void;
  // Interactive Daily Free Spin (7 Segments & 1-in-100 ₹100 Jackpot)
  isDailySpinModalOpen: boolean;
  setIsDailySpinModalOpen: (open: boolean) => void;
  openDailySpin: () => void;
  dailySpinState: DailySpinState | null;
  creditDailySpinReward: (amount: number, isJackpot: boolean) => void;
}

const MAX_BALANCE = Infinity; // No limits! Unlimited balance growth
const MIN_TOPUP = 20;

const DEFAULT_USERS: User[] = [
  {
    id: 'BIT-782914',
    gameAccountId: 'BTY-GAME-782914',
    username: 'Aarav Royal',
    email: 'aarav.vip@bitora.demo',
    phone: '+91 98765 43210',
    role: 'player',
    balance: 100, // Fixed initial welcome bonus credits
    accountStatus: 'ACTIVE',
    riskLevel: 'LOW',
    violationCount: 0,
    illicitActivityFlags: [],
    gameSessionStatus: 'ONLINE',
    currentGame: 'Mines 24x24',
    lastActivity: 'Active on Mines 24x24',
    isSuspended: false,
    vipTier: 'Gold',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-12',
    totalWagered: 1250,
    totalWon: 1680,
  },
  {
    id: 'ADM-BITORA-01',
    gameAccountId: 'BTY-GAME-ADM01',
    username: 'Chief Supervisor (Admin)',
    email: 'admin@bitora.casino',
    phone: '+91 99999 00001',
    role: 'admin',
    balance: 5000,
    accountStatus: 'ACTIVE',
    riskLevel: 'LOW',
    violationCount: 0,
    illicitActivityFlags: [],
    gameSessionStatus: 'ONLINE',
    lastActivity: 'Monitoring Admin Command Suite',
    isSuspended: false,
    vipTier: 'Diamond VIP',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01',
    totalWagered: 0,
    totalWon: 0,
  },
  {
    id: 'BIT-990142',
    gameAccountId: 'BTY-GAME-990142',
    username: 'Priya Mehta',
    email: 'priya.m@bitora.demo',
    phone: '+91 98221 11234',
    role: 'player',
    balance: 1150,
    accountStatus: 'ACTIVE',
    riskLevel: 'LOW',
    violationCount: 0,
    illicitActivityFlags: [],
    gameSessionStatus: 'IN_GAME',
    currentGame: 'Fortune Tiger',
    lastActivity: '5 mins ago',
    isSuspended: false,
    vipTier: 'Silver',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-10-02',
    totalWagered: 950,
    totalWon: 1200,
  },
  {
    id: 'BIT-551029',
    gameAccountId: 'BTY-GAME-551029',
    username: 'Rohan Verma',
    email: 'rohan.v@bitora.demo',
    phone: '+91 94002 99881',
    role: 'player',
    balance: 400,
    accountStatus: 'SUSPENDED',
    statusReason: 'Policy violation: Automated betting script detected (>15 rounds/min)',
    statusUpdatedAt: '2026-10-25 11:20:00',
    suspensionExpiresAt: '2026-11-25 11:20:00',
    riskLevel: 'HIGH',
    violationCount: 2,
    illicitActivityFlags: ['Rapid betting velocity (>15 bets/min)', 'Multi-tab concurrent play'],
    gameSessionStatus: 'OFFLINE',
    lastActivity: '12 days ago',
    isSuspended: true, // Example suspended user for admin testing
    vipTier: 'Bronze',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-10-15',
    totalWagered: 450,
    totalWon: 200,
  },
  {
    id: 'BIT-238491',
    gameAccountId: 'BTY-GAME-238491',
    username: 'Vikram Patel',
    email: 'vikram.p@bitora.demo',
    phone: '+91 97110 55432',
    role: 'player',
    balance: 620,
    accountStatus: 'FROZEN',
    statusReason: 'Security Hold: Multiplier anomaly trigger and chargeback dispute',
    statusUpdatedAt: '2026-11-01 14:10:00',
    riskLevel: 'CRITICAL',
    violationCount: 3,
    illicitActivityFlags: ['Multiplier anomaly trigger', 'Chargeback risk detected', 'Arbitrage withdrawal pattern'],
    gameSessionStatus: 'IDLE',
    currentGame: 'Aviator/Crash',
    lastActivity: '35 mins ago',
    isSuspended: true,
    vipTier: 'Silver',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-10-20',
    totalWagered: 1800,
    totalWon: 2420,
  },
  {
    id: 'BIT-661902',
    gameAccountId: 'BTY-GAME-661902',
    username: 'Karan Malhotra',
    email: 'karan.m@bitora.demo',
    phone: '+91 96660 12890',
    role: 'player',
    balance: 0,
    accountStatus: 'BLOCKED',
    statusReason: 'Permanent Termination: Exploit attempt on European Roulette state and illicit behavior',
    statusUpdatedAt: '2026-11-04 16:45:00',
    riskLevel: 'CRITICAL',
    violationCount: 5,
    illicitActivityFlags: ['State tampering attempt', 'Client exploit injection', 'Terms of Service Section 8 violation'],
    gameSessionStatus: 'OFFLINE',
    lastActivity: 'Permanently Banned',
    isSuspended: true,
    vipTier: 'Bronze',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-10-18',
    totalWagered: 3200,
    totalWon: 4100,
  },
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-90812',
    userId: 'BIT-782914',
    type: 'TOP_UP',
    amount: 1000,
    balanceAfter: 2450,
    status: 'COMPLETED',
    timestamp: '2026-10-27 15:40:12',
    note: 'Demo virtual credit package top-up (₹1,000)',
  },
  {
    id: 'TXN-90811',
    userId: 'BIT-782914',
    type: 'ADMIN_GRANT',
    amount: 500,
    balanceAfter: 1450,
    status: 'COMPLETED',
    timestamp: '2026-10-26 18:22:45',
    note: 'Loyalty bonus demo credit grant',
    adminId: 'ADM-BITORA-01',
  },
];

const DEFAULT_GAME_HISTORY: GameRecord[] = [
  {
    id: 'GME-8841',
    userId: 'BIT-782914',
    game: 'MINES_24X24',
    gameName: 'Mines 24x24 Demo',
    wager: 100,
    multiplier: 2.45,
    payout: 245,
    profit: 145,
    outcome: 'WIN',
    timestamp: '2026-10-27 16:15:30',
    details: '6 safe tiles found (5 mines configuration)',
  },
  {
    id: 'GME-8840',
    userId: 'BIT-782914',
    game: 'AVIATOR',
    gameName: 'Aviator Flight Demo',
    wager: 150,
    multiplier: 1.82,
    payout: 273,
    profit: 123,
    outcome: 'WIN',
    timestamp: '2026-10-27 16:02:11',
    details: 'Cashed out at 1.82x before 3.40x crash',
  },
  {
    id: 'GME-8839',
    userId: 'BIT-782914',
    game: 'CHICKEN_ROAD',
    gameName: 'Chicken Road Demo',
    wager: 50,
    multiplier: 0,
    payout: 0,
    profit: -50,
    outcome: 'LOSS',
    timestamp: '2026-10-27 15:51:04',
    details: 'Obstacle collision on Step 4',
  },
];

const DEFAULT_DEPOSIT_REQUESTS: DepositRequest[] = [
  {
    id: 'DEP-40192',
    userId: 'BIT-782914',
    playerId: 'BIT-782914',
    username: 'Aarav Royal',
    paymentMethod: 'phonepe',
    paymentMethodName: 'PhonePe',
    amount: 500,
    utr: '429810284912',
    referenceNo: '429810284912',
    screenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=bitora.phonepe@ybl&pn=Bitora%20VIP%20PhonePe&am=500',
    status: 'APPROVED',
    createdAt: '2026-10-27 14:10:00',
    processedAt: '2026-10-27 14:15:22',
    adminId: 'ADM-BITORA-01',
  },
  {
    id: 'DEP-40193',
    userId: 'BIT-990142',
    playerId: 'BIT-990142',
    username: 'Priya Mehta',
    paymentMethod: 'gpay',
    paymentMethodName: 'Google Pay',
    amount: 1000,
    utr: '908219482103',
    referenceNo: '908219482103',
    screenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=bitora.gpay@okaxis&pn=Bitora%20VIP%20GPay&am=1000',
    status: 'PENDING',
    createdAt: '2026-10-27 17:05:14',
  },
];

const DEFAULT_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'AUD-1001',
    adminId: 'ADM-BITORA-01',
    targetUserId: 'BIT-782914',
    targetUsername: 'Aarav Royal',
    action: 'GRANT_CREDITS',
    amount: 500,
    reason: 'VIP Welcome appreciation demo package',
    timestamp: '2026-10-26 18:22:45',
  },
  {
    id: 'AUD-1002',
    adminId: 'ADM-BITORA-01',
    targetUserId: 'BIT-551029',
    targetUsername: 'Rohan Verma',
    action: 'SUSPEND_ACCOUNT',
    reason: 'Automated policy check: multiple consecutive rapid simulated actions',
    timestamp: '2026-10-27 09:30:10',
  },
];

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('bitora_users');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      return localStorage.getItem('bitora_current_uid') || '';
    } catch {
      return '';
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('bitora_transactions');
      return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  });

  const [gameHistory, setGameHistory] = useState<GameRecord[]>(() => {
    try {
      const saved = localStorage.getItem('bitora_games');
      return saved ? JSON.parse(saved) : DEFAULT_GAME_HISTORY;
    } catch {
      return DEFAULT_GAME_HISTORY;
    }
  });

  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => {
    try {
      const saved = localStorage.getItem('bitora_deposits');
      return saved ? JSON.parse(saved) : DEFAULT_DEPOSIT_REQUESTS;
    } catch {
      return DEFAULT_DEPOSIT_REQUESTS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('bitora_audits');
      return saved ? JSON.parse(saved) : DEFAULT_AUDIT_LOGS;
    } catch {
      return DEFAULT_AUDIT_LOGS;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('bitora_sound');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // First-Time Visitor Welcome Guarantee (₹100 Guaranteed Profit on First Game)
  const [hasClaimedFirstGameBonus, setHasClaimedFirstGameBonus] = useState<boolean>(() => {
    try {
      const uid = localStorage.getItem('bitora_current_uid') || 'BIT-782914';
      return localStorage.getItem(`bitora_first_bonus_${uid}`) === 'true';
    } catch {
      return false;
    }
  });
  const [firstGameBonusNotification, setFirstGameBonusNotification] = useState<string | null>(null);

  const dismissFirstGameBonusNotification = () => {
    setFirstGameBonusNotification(null);
  };

  // Google Sign-In 110 Credits Welcome Bonus Tracking
  const [welcomeBonusNotification, setWelcomeBonusNotification] = useState<string | null>(null);
  const [hasClaimedWelcomeBonus, setHasClaimedWelcomeBonus] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('bitora_welcome_bonus_claimed') === 'true' ||
        localStorage.getItem('bitora_phone_bonus_claimed') === 'true'
      );
    } catch {
      return false;
    }
  });

  const dismissWelcomeBonusNotification = () => {
    setWelcomeBonusNotification(null);
  };

  // Backwards compatibility aliases
  const phoneBonusNotification = welcomeBonusNotification;
  const dismissPhoneBonusNotification = dismissWelcomeBonusNotification;
  const hasClaimedPhoneBonus = hasClaimedWelcomeBonus;


  // Administrator-Configured Static Payment UPI QR Codes for 3 Methods (Google Pay, PhonePe, Paytm)
  const [paymentMethodConfigs, setPaymentMethodConfigs] = useState<Record<PaymentMethodType, PaymentMethodConfig>>(() => {
    try {
      const saved = localStorage.getItem('bitora_payment_methods_config');
      if (saved) {
        return { ...DEFAULT_PAYMENT_METHOD_CONFIGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_PAYMENT_METHOD_CONFIGS;
  });

  const [ownerPaymentQr, setOwnerPaymentQrState] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('bitora_owner_deposit_qr') ||
        DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.qrImageUrl
      );
    } catch {
      return DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.qrImageUrl;
    }
  });

  const [ownerUpiId, setOwnerUpiId] = useState<string>(() => {
    try {
      return localStorage.getItem('bitora_owner_upi_id') || DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.upiId;
    } catch {
      return DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.upiId;
    }
  });

  const [ownerPayeeName, setOwnerPayeeName] = useState<string>(() => {
    try {
      return localStorage.getItem('bitora_owner_payee_name') || DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.payeeName;
    } catch {
      return DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.payeeName;
    }
  });

  // Sync with server deposit config on mount
  useEffect(() => {
    fetch('/api/deposit/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          if (data.methods) {
            setPaymentMethodConfigs(prev => ({ ...prev, ...data.methods }));
          }
          if (data.config) {
            if (data.config.qrImageUrl) setOwnerPaymentQrState(data.config.qrImageUrl);
            if (data.config.upiId) setOwnerUpiId(data.config.upiId);
            if (data.config.payeeName) setOwnerPayeeName(data.config.payeeName);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Update a specific payment method QR code (Google Pay, PhonePe, or Paytm) - Exclusively Administrator
  const updateMethodPaymentQr = (
    method: PaymentMethodType,
    photoUrl: string,
    upiId?: string,
    payeeName?: string,
    instructions?: string
  ): boolean => {
    if (currentUser?.role !== 'admin') {
      console.warn('Authority check failed: only administrators can configure deposit QR codes.');
      return false;
    }

    setPaymentMethodConfigs(prev => {
      const target = prev[method] || DEFAULT_PAYMENT_METHOD_CONFIGS[method];
      const updated: PaymentMethodConfig = {
        ...target,
        qrImageUrl: photoUrl || target.qrImageUrl,
        upiId: upiId !== undefined ? upiId : target.upiId,
        payeeName: payeeName !== undefined ? payeeName : target.payeeName,
        instructions: instructions !== undefined ? instructions : target.instructions,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.id,
      };
      const next = { ...prev, [method]: updated };
      try {
        localStorage.setItem('bitora_payment_methods_config', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Also mirror to legacy single state if gpay
    if (method === 'gpay') {
      if (photoUrl) setOwnerPaymentQrState(photoUrl);
      if (upiId) setOwnerUpiId(upiId);
      if (payeeName) setOwnerPayeeName(payeeName);
      try {
        if (photoUrl) localStorage.setItem('bitora_owner_deposit_qr', photoUrl);
        if (upiId) localStorage.setItem('bitora_owner_upi_id', upiId);
        if (payeeName) localStorage.setItem('bitora_owner_payee_name', payeeName);
      } catch {}
    }

    // Sync to backend /api/deposit/config
    fetch('/api/deposit/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method,
        qrImageUrl: photoUrl,
        upiId,
        payeeName,
        instructions,
        adminRole: 'admin',
        adminId: currentUser.id,
      }),
    }).catch(() => {});

    return true;
  };

  const updateOwnerPaymentQr = (photoUrl: string, upiId?: string, payeeName?: string): boolean => {
    return updateMethodPaymentQr('gpay', photoUrl, upiId, payeeName);
  };

  // 10-Minute Deposit Clearance System
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>(() => {
    try {
      const saved = localStorage.getItem('bitora_pending_deposits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [depositClearanceNotification, setDepositClearanceNotification] = useState<string | null>(null);

  const dismissDepositClearanceNotification = () => {
    setDepositClearanceNotification(null);
  };

  useEffect(() => {
    try {
      localStorage.setItem('bitora_pending_deposits', JSON.stringify(pendingDeposits));
    } catch {}
  }, [pendingDeposits]);

  // Periodic Checker: Releasing credits only after 10 minutes (600,000 ms)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setPendingDeposits(prev => {
        let hasChanges = false;
        const next = prev.map(p => {
          if (p.status === 'PENDING_10_MIN' && now >= p.releaseAt) {
            hasChanges = true;
            // 10-Minute window passed! Release exact credit amount to player's balance
            setUsers(uList =>
              uList.map(u => (u.id === p.userId ? { ...u, balance: u.balance + p.amount } : u))
            );
            // Update the transaction in statement to COMPLETED
            setTransactions(tList =>
              tList.map(t =>
                t.id === p.id
                  ? {
                      ...t,
                      status: 'COMPLETED',
                      note: `Deposit Cleared & Released after 10-Minute Verification (+₹${p.amount.toLocaleString('en-IN')})`,
                    }
                  : t
              )
            );
            sounds.cashOutWin();
            setDepositClearanceNotification(
              `🎉 Deposit Cleared! ₹${p.amount.toLocaleString('en-IN')} has been added to your balance after 10-minute verification.`
            );
            return { ...p, status: 'CLEARED' as const };
          }
          return p;
        });
        return hasChanges ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const adminFastForwardDeposit = (depositId: string) => {
    setPendingDeposits(prev =>
      prev.map(p => {
        if (p.id === depositId && p.status === 'PENDING_10_MIN') {
          return { ...p, releaseAt: Date.now() };
        }
        return p;
      })
    );
  };

  useEffect(() => {
    try {
      const claimed = localStorage.getItem(`bitora_first_bonus_${currentUserId}`) === 'true';
      setHasClaimedFirstGameBonus(claimed);
    } catch {}
  }, [currentUserId]);

  useEffect(() => {
    sounds.enabled = soundEnabled;
    try {
      localStorage.setItem('bitora_sound', soundEnabled.toString());
    } catch {}
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  useEffect(() => {
    try {
      localStorage.setItem('bitora_users', JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('bitora_current_uid', currentUserId);
    } catch {}
  }, [currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem('bitora_transactions', JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('bitora_games', JSON.stringify(gameHistory));
    } catch {}
  }, [gameHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('bitora_deposits', JSON.stringify(depositRequests));
    } catch {}
  }, [depositRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('bitora_audits', JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  const currentUser = users.find(u => u.id === currentUserId) || null;

  const loginAs = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(user.id);
      try {
        localStorage.setItem('bitora_current_uid', user.id);
      } catch {}
      sounds.chipClick();
    }
  };

  const loginWithCredentials = (identifier: string, role?: 'player' | 'admin'): boolean => {
    const target = users.find(u => 
      (u.email.toLowerCase() === identifier.toLowerCase() || 
       u.username.toLowerCase() === identifier.toLowerCase() ||
       u.id.toLowerCase() === identifier.toLowerCase()) &&
      (!role || u.role === role)
    );
    if (target) {
      setCurrentUserId(target.id);
      try {
        localStorage.setItem('bitora_current_uid', target.id);
      } catch {}
      sounds.chipClick();
      return true;
    }
    return false;
  };

  const registerUser = (username: string, email: string, phone: string): User => {
    const serial = Math.floor(100000 + Math.random() * 900000);
    const newId = `BIT-${serial}`;
    const newGameAccountId = `BTY-GAME-${serial}`;
    const newUser: User = {
      id: newId,
      gameAccountId: newGameAccountId,
      username,
      email,
      phone: phone || '+91 98000 00000',
      role: 'player',
      balance: 100, // Fixed initial welcome bonus of exactly 100 credits
      accountStatus: 'ACTIVE',
      riskLevel: 'LOW',
      violationCount: 0,
      illicitActivityFlags: [],
      gameSessionStatus: 'ONLINE',
      lastActivity: 'Just registered',
      isSuspended: false,
      vipTier: 'Bronze',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString().split('T')[0],
      totalWagered: 0,
      totalWon: 0,
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newUser.id);
    try {
      localStorage.setItem('bitora_current_uid', newUser.id);
    } catch {}

    // Initial transaction log with fixed 100 credits
    const initialTxn: Transaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      userId: newUser.id,
      type: 'TOP_UP',
      amount: 100,
      balanceAfter: 100,
      status: 'COMPLETED',
      timestamp: new Date().toLocaleString(),
      note: 'Fixed Welcome Bonus (+100 Credits)',
    };
    setTransactions(prev => [initialTxn, ...prev]);

    sounds.cashOutWin();
    return newUser;
  };

  const logout = () => {
    sounds.chipClick();
    setCurrentUserId('');
    try {
      localStorage.removeItem('bitora_current_uid');
    } catch {}
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updates } : u));
    sounds.chipClick();
  };

  // Exact timestamp with seconds helper
  const formatExactTimestamp = () => {
    const d = new Date();
    return (
      d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ', ' +
      d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    );
  };

  // Firebase Google Auth Sign-In & 100 Credits Welcome Bonus Crediting
  const loginWithFirebaseGoogle = async (
    firebaseUser: {
      uid: string;
      email?: string | null;
      displayName?: string | null;
      photoURL?: string | null;
    }
  ): Promise<{ isNewBonus: boolean; bonusAmount: number; user: User }> => {
    const userEmail = firebaseUser.email?.trim().toLowerCase() || `google_${firebaseUser.uid.slice(0, 8)}@bitora.vip`;
    const bonusKey = `bitora_google_bonus_${firebaseUser.uid}`;
    let alreadyClaimed = false;
    try {
      alreadyClaimed = localStorage.getItem(bonusKey) === 'true';
    } catch {}

    const bonusAmount = 100;
    let isNewBonus = false;

    // Check if user already exists
    let target = users.find(
      u =>
        u.id === firebaseUser.uid ||
        (u.email && u.email.toLowerCase() === userEmail) ||
        u.id === `GGL-${firebaseUser.uid.slice(0, 8)}`
    );

    let activeUser: User;

    if (!target) {
      const serial = Math.floor(100000 + Math.random() * 900000);
      const newId = `BIT-${serial}`;
      const newGameAccountId = `BTY-GAME-${serial}`;
      // Guarantee exactly 100 credits welcome bonus for new verified Google user
      const initialBalance = bonusAmount;
      const newUser: User = {
        id: newId,
        gameAccountId: newGameAccountId,
        username: firebaseUser.displayName || userEmail.split('@')[0] || 'VIP Player',
        email: userEmail,
        role: 'player',
        balance: initialBalance,
        accountStatus: 'ACTIVE',
        riskLevel: 'LOW',
        violationCount: 0,
        illicitActivityFlags: [],
        gameSessionStatus: 'ONLINE',
        lastActivity: 'Signed in via Google',
        isSuspended: false,
        vipTier: 'Gold',
        avatar:
          firebaseUser.photoURL ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString().split('T')[0],
        totalWagered: 0,
        totalWon: 0,
      };

      setUsers(prev => [newUser, ...prev]);
      setCurrentUserId(newUser.id);
      try {
        localStorage.setItem('bitora_current_uid', newUser.id);
      } catch {}
      activeUser = newUser;

      const exactTime = formatExactTimestamp();

      isNewBonus = true;
      const bonusTxn: Transaction = {
        id: `BN-${Date.now().toString().slice(-6)}`,
        userId: newUser.id,
        type: 'TOP_UP',
        amount: bonusAmount,
        balanceAfter: initialBalance,
        status: 'COMPLETED',
        timestamp: exactTime,
        note: `🎉 Google Sign-In Verified Fixed Welcome Bonus (+${bonusAmount} Credits)`,
      };
      setTransactions(prev => [bonusTxn, ...prev]);
    } else {
      activeUser = target;
      setCurrentUserId(target.id);
      try {
        localStorage.setItem('bitora_current_uid', target.id);
      } catch {}

      if (!alreadyClaimed) {
        isNewBonus = true;
        const newBalance = target.balance + bonusAmount;
        setUsers(prev => prev.map(u => (u.id === target!.id ? { ...u, balance: newBalance } : u)));
        activeUser = { ...target, balance: newBalance };

        const exactTime = formatExactTimestamp();
        const bonusTxn: Transaction = {
          id: `BN-${Date.now().toString().slice(-6)}`,
          userId: target.id,
          type: 'TOP_UP',
          amount: bonusAmount,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          timestamp: exactTime,
          note: `🎉 Google Sign-In Verified Fixed Welcome Bonus (+${bonusAmount} Credits)`,
        };
        setTransactions(prev => [bonusTxn, ...prev]);
      }
    }

    if (isNewBonus) {
      try {
        localStorage.setItem(bonusKey, 'true');
        localStorage.setItem('bitora_welcome_bonus_claimed', 'true');
      } catch {}
      setHasClaimedWelcomeBonus(true);
      setWelcomeBonusNotification(
        `🎉 Google Sign-In Bonus Credited! Exactly ${bonusAmount} credits have been added to your wallet balance.`
      );
      sounds.cashOutWin();

      // Persist to Firestore
      try {
        if (db && auth.currentUser && auth.currentUser.uid === firebaseUser.uid) {
          await setDoc(
            doc(db, 'users', firebaseUser.uid),
            {
              uid: firebaseUser.uid,
              email: userEmail,
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              walletBonusAwarded: bonusAmount,
              balance: activeUser.balance,
              bonusClaimedAt: serverTimestamp(),
              lastSignIn: serverTimestamp(),
              status: 'ACTIVE',
            },
            { merge: true }
          );
        }
      } catch (firestoreErr) {
        console.warn('Firestore user doc sync notice:', firestoreErr);
      }
    } else {
      sounds.chipClick();
    }

    return { isNewBonus, bonusAmount, user: activeUser };
  };

  // Global Firebase Auth State Listener to ensure 100 credit welcome bonus trigger
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await loginWithFirebaseGoogle({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        } catch (e) {
          console.warn('Firebase auth state listener sync note:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Firebase Mobile Auth Sign-In & 110 Credits Welcome Bonus Crediting
  const loginWithFirebasePhone = async (
    phoneNumber: string,
    firebaseUid: string
  ): Promise<{ isNewBonus: boolean; bonusAmount: number; user: User }> => {
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    const cleanSuffix = cleanDigits.slice(-6) || Math.floor(100000 + Math.random() * 900000).toString();
    const bonusKey = `bitora_phone_bonus_${cleanDigits || firebaseUid}`;
    let alreadyClaimed = false;
    try {
      alreadyClaimed = localStorage.getItem(bonusKey) === 'true';
    } catch {}

    const bonusAmount = 100;
    let isNewBonus = false;

    // Check if user already exists with this phone or ID
    let target = users.find(
      u => (u.phone && u.phone.replace(/\D/g, '') === cleanDigits) || u.id === `TEL-${cleanSuffix}` || u.id === firebaseUid
    );

    let activeUser: User;

    if (!target) {
      const newId = `BIT-${cleanSuffix}`;
      const newGameAccountId = `BTY-GAME-${cleanSuffix}`;
      // Fixed welcome bonus of exactly 110 credits with zero unverified initial credits
      const initialBalance = alreadyClaimed ? 0 : bonusAmount;
      const newUser: User = {
        id: newId,
        gameAccountId: newGameAccountId,
        username: `Player ${cleanDigits.slice(-4) || 'VIP'}`,
        email: `${newId.toLowerCase()}@phone.bitora`,
        phone: phoneNumber,
        role: 'player',
        balance: initialBalance,
        accountStatus: 'ACTIVE',
        riskLevel: 'LOW',
        violationCount: 0,
        illicitActivityFlags: [],
        gameSessionStatus: 'ONLINE',
        lastActivity: 'Active on platform',
        isSuspended: false,
        vipTier: 'Gold',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString().split('T')[0],
        totalWagered: 0,
        totalWon: 0,
      };

      setUsers(prev => [newUser, ...prev]);
      setCurrentUserId(newUser.id);
      try {
        localStorage.setItem('bitora_current_uid', newUser.id);
      } catch {}
      activeUser = newUser;

      const exactTime = formatExactTimestamp();

      if (!alreadyClaimed) {
        isNewBonus = true;
        const bonusTxn: Transaction = {
          id: `BN-${Date.now().toString().slice(-6)}`,
          userId: newUser.id,
          type: 'TOP_UP',
          amount: bonusAmount,
          balanceAfter: initialBalance,
          status: 'COMPLETED',
          timestamp: exactTime,
          note: `🎉 Verified Mobile Sign-In Fixed Welcome Bonus (+${bonusAmount} Credits)`,
        };
        setTransactions(prev => [bonusTxn, ...prev]);
      }
    } else {
      activeUser = target;
      setCurrentUserId(target.id);
      try {
        localStorage.setItem('bitora_current_uid', target.id);
      } catch {}

      if (!alreadyClaimed) {
        isNewBonus = true;
        const newBalance = target.balance + bonusAmount;
        setUsers(prev => prev.map(u => (u.id === target!.id ? { ...u, balance: newBalance } : u)));
        activeUser = { ...target, balance: newBalance };

        const exactTime = formatExactTimestamp();
        const bonusTxn: Transaction = {
          id: `BN-${Date.now().toString().slice(-6)}`,
          userId: target.id,
          type: 'TOP_UP',
          amount: bonusAmount,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          timestamp: exactTime,
          note: `🎉 Verified Mobile Sign-In Fixed Welcome Bonus (+${bonusAmount} Credits)`,
        };
        setTransactions(prev => [bonusTxn, ...prev]);
      }
    }

    if (isNewBonus) {
      try {
        localStorage.setItem(bonusKey, 'true');
        localStorage.setItem('bitora_phone_bonus_claimed', 'true');
      } catch {}
      setHasClaimedWelcomeBonus(true);
      setWelcomeBonusNotification(
        `🎉 VIP Sign-In Bonus Credited! Exactly ${bonusAmount} credits have been added to your wallet balance.`
      );
      sounds.cashOutWin();

      // Persist to Firestore collection if active Firebase Auth session is present
      try {
        if (db && auth.currentUser && auth.currentUser.uid === firebaseUid) {
          await setDoc(
            doc(db, 'users', firebaseUid),
            {
              uid: firebaseUid,
              phoneNumber,
              walletBonusAwarded: bonusAmount,
              bonusClaimedAt: serverTimestamp(),
              lastSignIn: serverTimestamp(),
              status: 'ACTIVE',
            },
            { merge: true }
          );
        }
      } catch (firestoreErr) {
        // Safe offline/demo handling
      }
    } else {
      sounds.chipClick();
    }

    return { isNewBonus, bonusAmount, user: activeUser };
  };

  // 7-Day Cyclical Progressive Daily Check-In System
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [dailyCheckInState, setDailyCheckInState] = useState<DailyCheckInState>(() => {
    return getDailyCheckInState(currentUserId);
  });

  const openDailyCheckIn = () => {
    setDailyCheckInState(getDailyCheckInState(currentUserId));
    setIsCheckInModalOpen(true);
  };

  // Re-synchronize check-in state whenever active user changes
  useEffect(() => {
    if (currentUserId) {
      setDailyCheckInState(getDailyCheckInState(currentUserId));
    }
  }, [currentUserId]);

  // Automatic trigger upon initial daily login (restricted to once per user per day)
  useEffect(() => {
    if (currentUser && currentUser.role === 'player') {
      const today = getTodayDateKey();
      const state = getDailyCheckInState(currentUser.id);
      const autoShownSessionKey = `bitora_checkin_autoshow_${currentUser.id}_${today}`;

      // Automatically trigger modal if reward for today has not been claimed yet
      if (!state.hasClaimedToday && sessionStorage.getItem(autoShownSessionKey) !== 'true') {
        sessionStorage.setItem(autoShownSessionKey, 'true');
        const timer = setTimeout(() => {
          setIsCheckInModalOpen(true);
        }, 900);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser?.id]);

  const claimDailyCheckIn = (): { success: boolean; amount: number; day: number; message: string } => {
    if (!currentUser) {
      return { success: false, amount: 0, day: 1, message: 'Please sign in to claim your daily VIP reward.' };
    }

    const res = claimDailyCheckInReward(currentUser.id);
    if (!res.success) {
      return { success: false, amount: 0, day: res.state.currentDay, message: res.message };
    }

    // Add credits directly to unified wallet balance
    const rewardCredits = res.reward.credits;
    const newBalance = currentUser.balance + rewardCredits;
    const exactTime = formatExactTimestamp();

    setUsers(prev => prev.map(u => (u.id === currentUser.id ? { ...u, balance: newBalance } : u)));

    // Record verified transaction in statement
    const checkinTxn: Transaction = {
      id: `DC-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      type: 'TOP_UP',
      amount: rewardCredits,
      balanceAfter: newBalance,
      status: 'COMPLETED',
      timestamp: exactTime,
      note: `🎉 Day ${res.reward.day} Daily Check-In Bonus (+${rewardCredits} Credits)${res.reward.isPeak ? ' - Cycle Peak 👑' : ''}`,
    };
    setTransactions(prev => [checkinTxn, ...prev]);

    // Update check-in state
    setDailyCheckInState(res.state);
    sounds.cashOutWin();

    // Persist to Firestore if authenticated with Firebase
    try {
      if (db && auth.currentUser && auth.currentUser.uid === currentUser.id) {
        setDoc(
          doc(db, 'users', currentUser.id),
          {
            balance: newBalance,
            lastDailyCheckIn: exactTime,
            dailyCheckInDay: res.reward.day,
            dailyCheckInStreak: res.state.streak,
          },
          { merge: true }
        ).catch(() => {});
      }
    } catch {}

    return {
      success: true,
      amount: rewardCredits,
      day: res.reward.day,
      message: res.message,
    };
  };

  // Interactive Daily Free Spin System (7 Segments & 1-in-100 ₹100 Jackpot)
  const [isDailySpinModalOpen, setIsDailySpinModalOpen] = useState<boolean>(false);
  const [dailySpinState, setDailySpinState] = useState<DailySpinState | null>(() => {
    return currentUserId ? getUserDailySpinState(currentUserId) : null;
  });

  const openDailySpin = () => {
    if (currentUserId) {
      setDailySpinState(getUserDailySpinState(currentUserId));
    }
    setIsDailySpinModalOpen(true);
  };

  useEffect(() => {
    if (currentUserId) {
      setDailySpinState(getUserDailySpinState(currentUserId));
    } else {
      setDailySpinState(null);
    }
  }, [currentUserId]);

  const creditDailySpinReward = (amount: number, isJackpot: boolean) => {
    if (!currentUser) return;
    if (amount <= 0) return;

    const newBalance = currentUser.balance + amount;
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? { ...u, balance: newBalance } : u)));

    const exactTime = formatExactTimestamp();
    const spinTxn: Transaction = {
      id: `SPIN-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      type: 'TOP_UP',
      amount,
      balanceAfter: newBalance,
      status: 'COMPLETED',
      timestamp: exactTime,
      note: isJackpot
        ? `👑 Daily Free Spin 1-in-100 Jackpot (+₹${amount} INR)`
        : `🎡 Daily Free Spin Reward (+₹${amount} INR)`,
    };
    setTransactions(prev => [spinTxn, ...prev]);

    // Persist to Firestore if authenticated with Firebase
    try {
      if (db && auth.currentUser && auth.currentUser.uid === currentUser.id) {
        setDoc(
          doc(db, 'users', currentUser.id),
          {
            balance: newBalance,
            lastDailySpin: exactTime,
            lastSpinWonAmount: amount,
          },
          { merge: true }
        ).catch(() => {});
      }
    } catch {}
  };

  // Virtual Credit Top-up / Deposit (No upper limit! Uncapped growth)
  const topUpVirtualCredits = (amount: number): { success: boolean; message: string } => {
    return submitDeposit(amount, 'Instant Top-Up');
  };

  // Dedicated 10-Minute Deposit Clearance System (No immediate balance addition)
  const submitDeposit = (
    amount: number,
    method = 'UPI QR Scanner',
    referenceNo?: string
  ): { success: boolean; message: string; pendingDeposit?: PendingDeposit } => {
    if (!currentUser) return { success: false, message: 'No active session.' };
    if (currentUser.isSuspended) return { success: false, message: 'This account is suspended.' };
    if (amount <= 0) return { success: false, message: 'Enter a valid deposit amount.' };

    const depId = `DEP-${Date.now().toString().slice(-6)}`;
    const now = Date.now();
    const releaseTime = now + 10 * 60 * 1000; // Strictly 10 minutes (600 seconds)

    const newPending: PendingDeposit = {
      id: depId,
      userId: currentUser.id,
      amount,
      method,
      referenceNo: referenceNo || `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      createdAt: now,
      releaseAt: releaseTime,
      status: 'PENDING_10_MIN',
    };

    setPendingDeposits(prev => [newPending, ...prev]);

    const exactTime = formatExactTimestamp();
    const txn: Transaction = {
      id: depId,
      userId: currentUser.id,
      type: 'DEPOSIT',
      amount,
      balanceAfter: currentUser.balance, // Balance does NOT increase immediately!
      status: 'PENDING',
      timestamp: exactTime,
      note: `Deposit Submitted (${method}): 10-Minute Verification Clearance Active (+₹${amount.toLocaleString('en-IN')})`,
    };
    setTransactions(prev => [txn, ...prev]);
    sounds.chipClick();

    return {
      success: true,
      message: `Deposit of ₹${amount.toLocaleString('en-IN')} submitted! Verification window active. Funds will be credited in 10 minutes.`,
      pendingDeposit: newPending,
    };
  };


  // Dedicated Withdrawal System (No Limits up to available balance)
  const submitWithdrawal = (amount: number, destination: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'No active session.' };
    if (currentUser.isSuspended) return { success: false, message: 'This account is suspended.' };
    if (amount <= 0) return { success: false, message: 'Enter a valid withdrawal amount.' };
    if (currentUser.balance < amount) {
      return {
        success: false,
        message: `Insufficient balance! Your current balance is ₹${currentUser.balance.toLocaleString('en-IN')}.`,
      };
    }

    const newBalance = currentUser.balance - amount;
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? { ...u, balance: newBalance } : u)));

    const exactTime = formatExactTimestamp();
    const txn: Transaction = {
      id: `WTH-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      type: 'WITHDRAWAL',
      amount,
      balanceAfter: newBalance,
      status: 'COMPLETED',
      timestamp: exactTime,
      note: `Withdrawal to ${destination || 'Bank / UPI'} (-₹${amount.toLocaleString('en-IN')})`,
    };
    setTransactions(prev => [txn, ...prev]);
    sounds.cashOutWin();

    return {
      success: true,
      message: `Withdrawal of ₹${amount.toLocaleString('en-IN')} processed successfully to ${destination || 'your account'}!`,
    };
  };

  // Instant Refill Credits (Emergency refill so user never gets stuck with 0 credits)
  const instantRefillCredits = (amount = 5000) => {
    if (!currentUser) return;
    const newBalance = currentUser.balance + amount;
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? { ...u, balance: newBalance } : u)));

    const exactTime = formatExactTimestamp();
    const txn: Transaction = {
      id: `RFL-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      type: 'TOP_UP',
      amount,
      balanceAfter: newBalance,
      status: 'COMPLETED',
      timestamp: exactTime,
      note: `Quick Balance Refill (+₹${amount.toLocaleString('en-IN')})`,
    };
    setTransactions(prev => [txn, ...prev]);
    sounds.cashOutWin();
  };

  // Authority Enforcement & Security Checks
  const canUserPlay = (
    user?: User | null
  ): { allowed: boolean; reason?: string; status: UserAccountStatus } => {
    const u = user || currentUser;
    if (!u) {
      return { allowed: false, reason: 'Please sign in with a verified account to play.', status: 'ACTIVE' };
    }
    if (u.accountStatus === 'BLOCKED') {
      return {
        allowed: false,
        reason:
          u.statusReason ||
          'Account PERMANENTLY BLOCKED by administrator for illicit behavior or terms of service violations.',
        status: 'BLOCKED',
      };
    }
    if (u.accountStatus === 'SUSPENDED') {
      return {
        allowed: false,
        reason:
          u.statusReason ||
          'Account is temporarily SUSPENDED by platform supervisor. Access restricted pending review.',
        status: 'SUSPENDED',
      };
    }
    if (u.accountStatus === 'FROZEN') {
      return {
        allowed: false,
        reason:
          u.statusReason ||
          'Security Freeze: In-game actions and betting privileges are frozen by administration.',
        status: 'FROZEN',
      };
    }
    if (u.isSuspended) {
      return {
        allowed: false,
        reason: 'Account is suspended by administrator.',
        status: 'SUSPENDED',
      };
    }
    return { allowed: true, status: 'ACTIVE' };
  };

  const canUserTransact = (
    user?: User | null
  ): { allowed: boolean; reason?: string; status: UserAccountStatus } => {
    return canUserPlay(user);
  };

  // Record a simulated game round (Unified Winnings Balance - NO LIMITS)
  const recordGameRound = (
    game: GameType,
    gameName: string,
    wager: number,
    multiplier: number,
    payout: number,
    details?: string
  ): boolean => {
    if (!currentUser) return false;
    const playCheck = canUserPlay(currentUser);
    if (!playCheck.allowed) return false;
    if (currentUser.balance < wager) return false;

    // First-Time Visitor Guarantee: First game round guarantees at least ₹100 net profit!
    const bonusKey = `bitora_first_bonus_${currentUser.id}`;
    let alreadyClaimed = false;
    try {
      alreadyClaimed = localStorage.getItem(bonusKey) === 'true';
    } catch {}

    let finalProfit = payout - wager;
    let finalPayout = payout;
    let finalMultiplier = multiplier;
    let isWelcomeBonusAwarded = false;

    if (!alreadyClaimed) {
      finalProfit = Math.max(finalProfit, 100);
      finalPayout = wager + finalProfit;
      finalMultiplier = Number((finalPayout / wager).toFixed(2));
      isWelcomeBonusAwarded = true;
      try {
        localStorage.setItem(bonusKey, 'true');
      } catch {}
      setHasClaimedFirstGameBonus(true);
      setFirstGameBonusNotification(
        `🎉 First-Game Welcome Bonus! You won a guaranteed ₹100 net profit in ${gameName}!`
      );
      sounds.cashOutWin();
    }

    const newBalance = Math.max(0, currentUser.balance + finalProfit);
    const outcome = finalProfit >= 0 ? 'WIN' : 'LOSS';
    const exactTime = formatExactTimestamp();

    // Determine risk/anomaly flag for admin in-game activity monitor
    let riskFlag: string | undefined;
    if (finalMultiplier >= 20) {
      riskFlag = 'Multiplier Surge (≥20x)';
    } else if (wager >= 1000) {
      riskFlag = 'High Wager Spike (≥₹1,000)';
    } else if (finalProfit >= 2000) {
      riskFlag = 'High Profit Spike (≥₹2,000)';
    }

    // Update user stats, unified balance, and live in-game status
    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            balance: newBalance,
            totalWagered: u.totalWagered + wager,
            totalWon: u.totalWon + (finalPayout > 0 ? finalPayout : 0),
            currentGame: gameName,
            gameSessionStatus: 'IN_GAME',
            lastActivity: `Played ${gameName} (${outcome === 'WIN' ? `+₹${finalProfit}` : `-₹${wager}`})`,
          };
        }
        return u;
      })
    );

    // Record game round with connected game account linkage
    const gameRecord: GameRecord = {
      id: `GME-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      gameAccountId: currentUser.gameAccountId || `BTY-GAME-${currentUser.id.replace(/[^a-zA-Z0-9]/g, '')}`,
      username: currentUser.username,
      game,
      gameName,
      wager,
      multiplier: Number(finalMultiplier.toFixed(2)),
      payout: Number(finalPayout.toFixed(2)),
      profit: Number(finalProfit.toFixed(2)),
      outcome,
      timestamp: exactTime,
      riskFlag,
      details: isWelcomeBonusAwarded
        ? `${details ? details + ' | ' : ''}🎉 FIRST VISIT BONUS: +₹100 GUARANTEED PROFIT`
        : details,
    };
    setGameHistory(prev => [gameRecord, ...prev]);

    // Record statement transaction with exact game, won/lost amount, and time with seconds
    const txn: Transaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      type: finalProfit >= 0 ? 'GAME_WIN' : 'GAME_LOSS',
      amount: Math.abs(finalProfit),
      balanceAfter: newBalance,
      status: 'COMPLETED',
      timestamp: exactTime,
      gameName,
      note: isWelcomeBonusAwarded
        ? `${gameName}: 🎉 FIRST GAME WELCOME BONUS! Won ₹${finalPayout.toLocaleString('en-IN')} (Net +₹${finalProfit.toLocaleString('en-IN')} Profit) @ ${finalMultiplier.toFixed(2)}x`
        : finalProfit >= 0
        ? `${gameName}: Won ₹${finalPayout.toLocaleString('en-IN')} (Net +₹${finalProfit.toLocaleString('en-IN')}) @ ${finalMultiplier.toFixed(2)}x`
        : `${gameName}: Bet Lost -₹${wager.toLocaleString('en-IN')}`,
    };
    setTransactions(prev => [txn, ...prev]);

    return true;
  };

  // Admin Grant Credits
  const adminGrantCredits = (targetUserId: string, amount: number, reason: string): { success: boolean; message: string } => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return { success: false, message: 'Target user not found.' };

    const newBal = target.balance + amount;
    setUsers(prev => prev.map(u => (u.id === targetUserId ? { ...u, balance: newBal } : u)));

    // Audit Log
    const audit: AdminAuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      adminId: currentUser?.id || 'ADM-BITORA-01',
      targetUserId,
      targetUsername: target.username,
      action: 'GRANT_CREDITS',
      amount: amount,
      reason: reason || 'Manual demo credit injection by Administrator',
      timestamp: new Date().toLocaleString(),
    };
    setAuditLogs(prev => [audit, ...prev]);

    // User Transaction Log
    const txn: Transaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      userId: targetUserId,
      type: 'ADMIN_GRANT',
      amount: amount,
      balanceAfter: newBal,
      status: 'COMPLETED',
      timestamp: new Date().toLocaleString(),
      note: `Admin Credit Grant: ${reason || 'VIP Adjustment'}`,
      adminId: currentUser?.id || 'ADM-BITORA-01',
    };
    setTransactions(prev => [txn, ...prev]);

    sounds.cashOutWin();
    return { success: true, message: `Successfully granted ₹${amount} demo credits to ${target.username}.` };
  };

  // Admin Deduct Credits
  const adminDeductCredits = (targetUserId: string, amount: number, reason: string): { success: boolean; message: string } => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return { success: false, message: 'Target user not found.' };

    const deductAmount = Math.min(amount, target.balance);
    const newBal = target.balance - deductAmount;

    setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, balance: newBal } : u));

    // Audit Log
    const audit: AdminAuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      adminId: currentUser?.id || 'ADM-BITORA-01',
      targetUserId,
      targetUsername: target.username,
      action: 'DEDUCT_CREDITS',
      amount: deductAmount,
      reason: reason || 'Manual credit deduction by Administrator',
      timestamp: new Date().toLocaleString(),
    };
    setAuditLogs(prev => [audit, ...prev]);

    // User Transaction Log
    const txn: Transaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      userId: targetUserId,
      type: 'ADMIN_DEDUCT',
      amount: deductAmount,
      balanceAfter: newBal,
      status: 'COMPLETED',
      timestamp: new Date().toLocaleString(),
      note: `Admin Credit Deduction: ${reason || 'Correction'}`,
      adminId: currentUser?.id || 'ADM-BITORA-01',
    };
    setTransactions(prev => [txn, ...prev]);

    sounds.chipClick();
    return { success: true, message: `Successfully deducted ₹${deductAmount} demo credits from ${target.username}.` };
  };

  // Admin Toggle Suspension
  const adminToggleSuspension = (targetUserId: string, reason: string) => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return;

    const newSuspendedState = !target.isSuspended;
    const newStatus: UserAccountStatus = newSuspendedState ? 'SUSPENDED' : 'ACTIVE';
    setUsers(prev =>
      prev.map(u =>
        u.id === targetUserId
          ? {
              ...u,
              isSuspended: newSuspendedState,
              accountStatus: newStatus,
              statusReason: reason || (newSuspendedState ? 'Account suspended by supervisor' : undefined),
              statusUpdatedAt: new Date().toLocaleString(),
            }
          : u
      )
    );

    const audit: AdminAuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      adminId: currentUser?.id || 'ADM-BITORA-01',
      targetUserId,
      targetUsername: target.username,
      action: newSuspendedState ? 'SUSPEND_ACCOUNT' : 'UNSUSPEND_ACCOUNT',
      reason: reason || (newSuspendedState ? 'Account suspended by supervisor' : 'Account reactivated by supervisor'),
      timestamp: new Date().toLocaleString(),
    };
    setAuditLogs(prev => [audit, ...prev]);
    sounds.chipClick();
  };

  // Full Administrative Sovereign Authority: Track, Freeze, Suspend, or Permanently Block
  const adminSetAccountStatus = (
    targetUserId: string,
    newStatus: UserAccountStatus,
    reason: string,
    policyViolationType?: string,
    suspensionHours?: number
  ): { success: boolean; message: string } => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return { success: false, message: 'Target user ID not found.' };

    const isSuspended = newStatus !== 'ACTIVE';
    const statusUpdatedAt = new Date().toLocaleString();
    const suspensionExpiresAt =
      suspensionHours && newStatus === 'SUSPENDED'
        ? new Date(Date.now() + suspensionHours * 3600 * 1000).toLocaleString()
        : undefined;

    setUsers(prev =>
      prev.map(u => {
        if (u.id === targetUserId) {
          const newViolationCount =
            newStatus === 'BLOCKED' || newStatus === 'FROZEN'
              ? u.violationCount + 1
              : u.violationCount;
          const newRiskLevel: RiskLevel =
            newStatus === 'BLOCKED'
              ? 'CRITICAL'
              : newStatus === 'FROZEN'
              ? 'HIGH'
              : newStatus === 'SUSPENDED'
              ? 'MEDIUM'
              : u.riskLevel;

          return {
            ...u,
            accountStatus: newStatus,
            isSuspended,
            statusReason: reason,
            statusUpdatedAt,
            suspensionExpiresAt,
            violationCount: newViolationCount,
            riskLevel: newRiskLevel,
            lastActivity: `Admin updated status to ${newStatus}`,
          };
        }
        return u;
      })
    );

    // Map audit action
    let auditAction: AdminAuditLog['action'] = 'SUSPEND_ACCOUNT';
    if (newStatus === 'ACTIVE') {
      auditAction = target.accountStatus === 'FROZEN' ? 'UNFREEZE_ACCOUNT' : 'UNSUSPEND_ACCOUNT';
    } else if (newStatus === 'FROZEN') {
      auditAction = 'FREEZE_ACCOUNT';
    } else if (newStatus === 'BLOCKED') {
      auditAction = 'BLOCK_ACCOUNT';
    } else if (newStatus === 'SUSPENDED') {
      auditAction = 'SUSPEND_ACCOUNT';
    }

    const audit: AdminAuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      adminId: currentUser?.id || 'ADM-BITORA-01',
      targetUserId,
      targetUsername: target.username,
      action: auditAction,
      reason: reason || `Account transitioned to ${newStatus} by administrator`,
      policyViolationType: policyViolationType || (newStatus === 'ACTIVE' ? undefined : 'Compliance Action'),
      timestamp: statusUpdatedAt,
    };
    setAuditLogs(prev => [audit, ...prev]);

    // Firestore sync if connected
    try {
      if (db) {
        setDoc(
          doc(db, 'users', targetUserId),
          {
            accountStatus: newStatus,
            isSuspended,
            statusReason: reason,
            statusUpdatedAt,
            suspensionExpiresAt,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }
    } catch {}

    sounds.chipClick();
    return {
      success: true,
      message: `User ${target.username} (${target.id}) status successfully updated to ${newStatus}.`,
    };
  };

  // Admin Flag Illicit Behavior
  const adminFlagIllicitBehavior = (
    targetUserId: string,
    flag: string,
    reason: string
  ): { success: boolean; message: string } => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return { success: false, message: 'Target user not found.' };

    const updatedFlags = Array.from(new Set([...(target.illicitActivityFlags || []), flag]));
    const newViolationCount = target.violationCount + 1;
    const newRiskLevel: RiskLevel =
      newViolationCount >= 3 ? 'CRITICAL' : newViolationCount >= 2 ? 'HIGH' : 'MEDIUM';

    setUsers(prev =>
      prev.map(u => {
        if (u.id === targetUserId) {
          return {
            ...u,
            illicitActivityFlags: updatedFlags,
            violationCount: newViolationCount,
            riskLevel: newRiskLevel,
          };
        }
        return u;
      })
    );

    const audit: AdminAuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      adminId: currentUser?.id || 'ADM-BITORA-01',
      targetUserId,
      targetUsername: target.username,
      action: 'FLAG_VIOLATION',
      reason: `${flag}: ${reason}`,
      policyViolationType: flag,
      timestamp: new Date().toLocaleString(),
    };
    setAuditLogs(prev => [audit, ...prev]);

    return {
      success: true,
      message: `Flagged policy violation "${flag}" on User ${target.id}. Risk level updated to ${newRiskLevel}.`,
    };
  };

  // Track User Live Game Session
  const trackUserGameSession = (userId: string, gameName: string, status: GameSessionStatus) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            currentGame: gameName,
            gameSessionStatus: status,
            lastActivity: status === 'IN_GAME' ? `Playing ${gameName}` : 'Active on platform',
          };
        }
        return u;
      })
    );
  };

  // Submit Manual Deposit Request
  const submitDepositRequest = (
    dataOrAmount:
      | number
      | {
          amount: number;
          utr: string;
          screenshotUrl: string;
          playerId?: string;
          paymentMethod?: PaymentMethodType;
          screenshotName?: string;
          screenshotSize?: string;
        },
    referenceNo?: string,
    qrUrl?: string
  ): DepositRequest => {
    let amount = 0;
    let utr = '';
    let screenshotUrl = '';
    let screenshotName = '';
    let screenshotSize = '';
    let playerId = '';
    let paymentMethod: PaymentMethodType = 'gpay';

    if (typeof dataOrAmount === 'object' && dataOrAmount !== null) {
      amount = dataOrAmount.amount;
      utr = dataOrAmount.utr;
      screenshotUrl = dataOrAmount.screenshotUrl;
      screenshotName = dataOrAmount.screenshotName || '';
      screenshotSize = dataOrAmount.screenshotSize || '';
      playerId = dataOrAmount.playerId || '';
      paymentMethod = dataOrAmount.paymentMethod || 'gpay';
    } else {
      amount = Number(dataOrAmount);
      utr = referenceNo || `REF-${Date.now().toString().slice(-6)}`;
      screenshotUrl = '';
    }

    const assignedPlayerId =
      playerId ||
      currentUser?.id ||
      currentUser?.gameAccountId ||
      `BIT-${Math.floor(100000 + Math.random() * 900000)}`;

    const selectedMethodConfig = paymentMethodConfigs[paymentMethod] || DEFAULT_PAYMENT_METHOD_CONFIGS[paymentMethod];

    const newReq: DepositRequest = {
      id: `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: currentUser?.id || assignedPlayerId,
      playerId: assignedPlayerId,
      username: currentUser?.username || 'Player',
      userEmail: currentUser?.email || '',
      paymentMethod,
      paymentMethodName: selectedMethodConfig.name,
      amount,
      utr: utr || `REF-${Date.now().toString().slice(-6)}`,
      referenceNo: utr,
      screenshotUrl: screenshotUrl || '',
      screenshotName: screenshotName || 'payment_proof.jpg',
      screenshotSize: screenshotSize || 'Screenshot Attached',
      qrUrl: qrUrl || selectedMethodConfig.qrImageUrl || ownerPaymentQr,
      status: 'PENDING',
      createdAt: new Date().toLocaleString('en-IN'),
    };

    setDepositRequests(prev => [newReq, ...prev]);
    sounds.chipClick();

    // Sync to backend /api/deposit/submit
    fetch('/api/deposit/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: newReq.userId,
        playerId: newReq.playerId,
        username: newReq.username,
        userEmail: newReq.userEmail,
        paymentMethod: newReq.paymentMethod,
        paymentMethodName: newReq.paymentMethodName,
        amount: newReq.amount,
        utr: newReq.utr,
        screenshotUrl: newReq.screenshotUrl,
        screenshotName: newReq.screenshotName,
        screenshotSize: newReq.screenshotSize,
      }),
    }).catch(() => {});

    return newReq;
  };

  // Admin Process Deposit Request: Verifies UTR & Player ID and manually credits player account
  const adminProcessDepositRequest = (requestId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    const req = depositRequests.find(r => r.id === requestId);
    if (!req) return;

    const adminId = currentUser?.id || 'ADM-BITORA-01';
    const processedAt = new Date().toLocaleString('en-IN');

    setDepositRequests(prev =>
      prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            processedAt,
            rejectionReason: action === 'REJECT' ? (reason || 'Declined during manual supervisor audit') : undefined,
            adminNote: action === 'APPROVE' ? (reason || 'UTR verified against bank statement') : undefined,
            adminId,
          };
        }
        return r;
      })
    );

    // If approved, verify Player ID and credit user account directly
    if (action === 'APPROVE') {
      // Find target user by userId or playerId or gameAccountId
      const target = users.find(
        u => u.id === req.userId || u.id === req.playerId || u.gameAccountId === req.playerId
      );

      if (target) {
        const addAmount = req.amount;
        const newBal = target.balance + addAmount;

        setUsers(prev => prev.map(u => (u.id === target.id ? { ...u, balance: newBal } : u)));

        // Transaction record
        const txn: Transaction = {
          id: `TXN-${Date.now().toString().slice(-6)}`,
          userId: target.id,
          type: 'DEPOSIT',
          amount: addAmount,
          balanceAfter: newBal,
          status: 'COMPLETED',
          timestamp: processedAt,
          note: `Manual UPI Deposit Verified (UTR: ${req.utr || req.referenceNo || 'N/A'}) - Player ID: ${req.playerId}`,
          adminId,
        };
        setTransactions(prev => [txn, ...prev]);
        sounds.cashOutWin();
      }
    }

    // Audit Log
    const audit: AdminAuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      adminId,
      targetUserId: req.userId || req.playerId,
      targetUsername: req.username,
      action: action === 'APPROVE' ? 'APPROVE_PAYMENT' : 'REJECT_PAYMENT',
      amount: req.amount,
      reason: reason || (action === 'APPROVE' ? `Manual UPI deposit verified (UTR: ${req.utr})` : 'Deposit declined'),
      timestamp: processedAt,
    };
    setAuditLogs(prev => [audit, ...prev]);

    // Sync to backend /api/deposit/review
    fetch('/api/deposit/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: req.id,
        action,
        adminRole: 'admin',
        adminId,
        reason,
      }),
    }).catch(() => {});

    sounds.chipClick();
  };

  const resetDemoData = () => {
    localStorage.removeItem('bitora_users');
    localStorage.removeItem('bitora_current_uid');
    localStorage.removeItem('bitora_transactions');
    localStorage.removeItem('bitora_games');
    localStorage.removeItem('bitora_deposits');
    localStorage.removeItem('bitora_audits');
    setUsers(DEFAULT_USERS);
    setCurrentUserId('BIT-782914');
    setTransactions(DEFAULT_TRANSACTIONS);
    setGameHistory(DEFAULT_GAME_HISTORY);
    setDepositRequests(DEFAULT_DEPOSIT_REQUESTS);
    setAuditLogs(DEFAULT_AUDIT_LOGS);
    sounds.cashOutWin();
  };

  const userTransactions = transactions.filter(t => !currentUser || t.userId === currentUser.id);
  const depositHistory = userTransactions.filter(
    t =>
      t.type === 'DEPOSIT' ||
      t.type === 'TOP_UP' ||
      t.type === 'ADMIN_GRANT' ||
      t.type === 'DEMO_PAYMENT_REQUEST'
  );
  const withdrawalHistory = userTransactions.filter(
    t => t.type === 'WITHDRAWAL' || t.type === 'ADMIN_DEDUCT'
  );

  const activePendingDeposit =
    pendingDeposits.find(
      p => p.userId === currentUserId && p.status === 'PENDING_10_MIN'
    ) || null;

  return (
    <GameContext.Provider
      value={{
        isAuthenticated: Boolean(currentUser),
        currentUser,
        users,
        transactions,
        gameHistory,
        depositRequests,
        auditLogs,
        soundEnabled,
        toggleSound,
        totalWinnings: currentUser ? (currentUser.totalWon || 0) : 0,
        winningsBalance: currentUser ? (currentUser.balance || 0) : 0,
        loginAs,
        loginWithCredentials,
        registerUser,
        logout,
        updateProfile,
        topUpVirtualCredits,
        submitDeposit,
        submitWithdrawal,
        instantRefillCredits,
        depositHistory,
        withdrawalHistory,
        recordGameRound,
        pendingDeposits,
        activePendingDeposit,
        depositClearanceNotification,
        dismissDepositClearanceNotification,
        adminFastForwardDeposit,
        adminGrantCredits,
        adminDeductCredits,
        adminToggleSuspension,
        adminSetAccountStatus,
        adminFlagIllicitBehavior,
        canUserPlay,
        canUserTransact,
        trackUserGameSession,
        submitDepositRequest,
        adminProcessDepositRequest,
        ownerPaymentQr,
        ownerUpiId,
        ownerPayeeName,
        updateOwnerPaymentQr,
        paymentMethodConfigs,
        updateMethodPaymentQr,
        resetDemoData,
        hasClaimedFirstGameBonus,
        firstGameBonusNotification,
        dismissFirstGameBonusNotification,
        welcomeBonusNotification,
        dismissWelcomeBonusNotification,
        hasClaimedWelcomeBonus,
        loginWithFirebaseGoogle,
        phoneBonusNotification,
        dismissPhoneBonusNotification,
        hasClaimedPhoneBonus,
        loginWithFirebasePhone,
        // Daily Check-In System
        dailyCheckInState,
        claimDailyCheckIn,
        isCheckInModalOpen,
        setIsCheckInModalOpen,
        openDailyCheckIn,
        // Daily Free Spin System
        isDailySpinModalOpen,
        setIsDailySpinModalOpen,
        openDailySpin,
        dailySpinState,
        creditDailySpinReward,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

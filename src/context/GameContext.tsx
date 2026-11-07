import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Transaction,
  GameRecord,
  DepositRequest,
  AdminAuditLog,
  GameType,
  PendingDeposit,
} from '../types';
import { sounds } from '../utils/soundEffects';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

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
  // Credits & Winnings Balance (Razorpay Payment Gateway & Instant Wallet Credit)
  topUpVirtualCredits: (amount: number) => { success: boolean; message: string };
  submitDeposit: (amount: number, method?: string, referenceNo?: string) => { success: boolean; message: string; pendingDeposit?: PendingDeposit };
  creditWalletFromRazorpay: (
    amount: number,
    paymentId: string,
    orderId: string,
    method?: string
  ) => { success: boolean; message: string; balanceAfter: number };
  razorpaySuccessNotification: { amount: number; paymentId: string; orderId: string } | null;
  dismissRazorpayNotification: () => void;
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
  // Admin Actions
  adminGrantCredits: (targetUserId: string, amount: number, reason: string) => { success: boolean; message: string };
  adminDeductCredits: (targetUserId: string, amount: number, reason: string) => { success: boolean; message: string };
  adminToggleSuspension: (targetUserId: string, reason: string) => void;
  // Deposit Request Demo
  submitDepositRequest: (amount: number, referenceNo: string, qrUrl: string) => DepositRequest;
  adminProcessDepositRequest: (requestId: string, action: 'APPROVE' | 'REJECT', reason?: string) => void;
  // Deposit QR / Payment Photo
  ownerPaymentQr: string;
  updateOwnerPaymentQr: (photoUrl: string) => boolean;
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
}

const MAX_BALANCE = Infinity; // No limits! Unlimited balance growth
const MIN_TOPUP = 20;

const DEFAULT_USERS: User[] = [
  {
    id: 'BIT-782914',
    username: 'Aarav Royal',
    email: 'aarav.vip@bitora.demo',
    phone: '+91 98765 43210',
    role: 'player',
    balance: 110, // Fixed initial welcome bonus credits
    isSuspended: false,
    vipTier: 'Gold',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-12',
    totalWagered: 0,
    totalWon: 0,
  },
  {
    id: 'ADM-BITORA-01',
    username: 'Chief Supervisor (Admin)',
    email: 'admin@bitora.casino',
    phone: '+91 99999 00001',
    role: 'admin',
    balance: 5000,
    isSuspended: false,
    vipTier: 'Diamond VIP',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01',
    totalWagered: 0,
    totalWon: 0,
  },
  {
    id: 'BIT-990142',
    username: 'Priya Mehta',
    email: 'priya.m@bitora.demo',
    phone: '+91 98221 11234',
    role: 'player',
    balance: 1150,
    isSuspended: false,
    vipTier: 'Silver',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-10-02',
    totalWagered: 950,
    totalWon: 1200,
  },
  {
    id: 'BIT-551029',
    username: 'Rohan Verma',
    email: 'rohan.v@bitora.demo',
    phone: '+91 94002 99881',
    role: 'player',
    balance: 400,
    isSuspended: true, // Example suspended user for admin testing
    vipTier: 'Bronze',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-10-15',
    totalWagered: 450,
    totalWon: 200,
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
    username: 'Aarav Royal',
    amount: 500,
    referenceNo: 'UPI-DEMO-994821',
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=bitora.demo@bank&pn=BITORA_DEMO&am=500',
    status: 'APPROVED',
    createdAt: '2026-10-27 14:10:00',
    processedAt: '2026-10-27 14:15:22',
    adminId: 'ADM-BITORA-01',
  },
  {
    id: 'DEP-40193',
    userId: 'BIT-990142',
    username: 'Priya Mehta',
    amount: 1000,
    referenceNo: 'UPI-DEMO-883102',
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=bitora.demo@bank&pn=BITORA_DEMO&am=1000',
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

  // Razorpay Online Payment Success State
  const [razorpaySuccessNotification, setRazorpaySuccessNotification] = useState<{
    amount: number;
    paymentId: string;
    orderId: string;
  } | null>(null);

  const dismissRazorpayNotification = () => {
    setRazorpaySuccessNotification(null);
  };

  // Owner Custom Payment Photo / QR Scanner
  const [ownerPaymentQr, setOwnerPaymentQrState] = useState<string>(() => {
    try {
      return localStorage.getItem('bitora_owner_deposit_qr') || '';
    } catch {
      return '';
    }
  });

  const updateOwnerPaymentQr = (photoUrl: string) => {
    // Authority check: user must be an administrator or have session authorization
    const isAuthorized = currentUser?.role === 'admin' || (typeof window !== 'undefined' && sessionStorage.getItem('bitora_scanner_authorized') === 'true');
    if (!isAuthorized && photoUrl) {
      console.warn('Authority check failed: only administrators or authorized users can replace the QR code photo.');
      return false;
    }

    setOwnerPaymentQrState(photoUrl);
    try {
      if (photoUrl) {
        localStorage.setItem('bitora_owner_deposit_qr', photoUrl);
      } else {
        localStorage.removeItem('bitora_owner_deposit_qr');
      }
    } catch {}
    return true;
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
    const newId = `BIT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newUser: User = {
      id: newId,
      username,
      email,
      phone: phone || '+91 98000 00000',
      role: 'player',
      balance: 110, // Fixed initial welcome bonus of exactly 110 credits
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

    // Initial transaction log with fixed 110 credits
    const initialTxn: Transaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      userId: newUser.id,
      type: 'TOP_UP',
      amount: 110,
      balanceAfter: 110,
      status: 'COMPLETED',
      timestamp: new Date().toLocaleString(),
      note: 'Fixed Welcome Bonus (+110 Credits)',
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

  // Firebase Google Auth Sign-In & 110 Credits Welcome Bonus Crediting
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
      alreadyClaimed =
        localStorage.getItem(bonusKey) === 'true' ||
        localStorage.getItem('bitora_welcome_bonus_claimed') === 'true';
    } catch {}

    const bonusAmount = 110;
    let isNewBonus = false;

    // Check if user already exists
    let target = users.find(
      u =>
        (u.email && u.email.toLowerCase() === userEmail) ||
        u.id === firebaseUser.uid ||
        u.id === `GGL-${firebaseUser.uid.slice(0, 8)}`
    );

    let activeUser: User;

    if (!target) {
      const newId = firebaseUser.uid;
      const initialBalance = alreadyClaimed ? 0 : bonusAmount;
      const newUser: User = {
        id: newId,
        username: firebaseUser.displayName || userEmail.split('@')[0] || 'VIP Player',
        email: userEmail,
        role: 'player',
        balance: initialBalance,
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
          note: `🎉 Google Sign-In Verified Fixed Welcome Bonus (+${bonusAmount} Credits)`,
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

    const bonusAmount = 110;
    let isNewBonus = false;

    // Check if user already exists with this phone or ID
    let target = users.find(
      u => (u.phone && u.phone.replace(/\D/g, '') === cleanDigits) || u.id === `TEL-${cleanSuffix}` || u.id === firebaseUid
    );

    let activeUser: User;

    if (!target) {
      const newId = `TEL-${cleanSuffix}`;
      // Fixed welcome bonus of exactly 110 credits with zero unverified initial credits
      const initialBalance = alreadyClaimed ? 0 : bonusAmount;
      const newUser: User = {
        id: newId,
        username: `Player ${cleanDigits.slice(-4) || 'VIP'}`,
        email: `${newId.toLowerCase()}@phone.bitora`,
        phone: phoneNumber,
        role: 'player',
        balance: initialBalance,
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

  // Razorpay Instant Wallet Crediting: Automatically credits player wallet upon verified payment
  const creditWalletFromRazorpay = (
    amount: number,
    paymentId: string,
    orderId: string,
    method = 'Razorpay Instant UPI / Card'
  ): { success: boolean; message: string; balanceAfter: number } => {
    if (!currentUser) return { success: false, message: 'No active player session.', balanceAfter: 0 };
    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return { success: false, message: 'Invalid deposit amount.', balanceAfter: currentUser.balance };
    }

    const newBalance = currentUser.balance + numAmount;

    // 1. Instantly credit balance in users state
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? { ...u, balance: newBalance } : u)));

    // 2. Record COMPLETED transaction immediately
    const exactTime = formatExactTimestamp();
    const txnId = `TXN-RP-${paymentId.replace(/^pay_/, '').slice(-6) || Date.now().toString().slice(-6)}`;
    const newTxn: Transaction = {
      id: txnId,
      userId: currentUser.id,
      type: 'TOP_UP',
      amount: numAmount,
      balanceAfter: newBalance,
      status: 'COMPLETED',
      timestamp: exactTime,
      note: `Razorpay Online Payment (${method}) - ID: ${paymentId}`,
    };
    setTransactions(prev => [newTxn, ...prev]);

    // 3. Mark any matching pending 10-min deposits as CLEARED immediately
    setPendingDeposits(prev =>
      prev.map(p =>
        p.userId === currentUser.id && p.status === 'PENDING_10_MIN' && p.amount === numAmount
          ? { ...p, status: 'CLEARED' as const }
          : p
      )
    );

    // 4. Celebratory sound and alert banner
    sounds.cashOutWin();
    setDepositClearanceNotification(
      `🎉 Razorpay Payment Verified! ₹${numAmount.toLocaleString('en-IN')} has been credited to your wallet balance.`
    );
    setRazorpaySuccessNotification({
      amount: numAmount,
      paymentId,
      orderId,
    });

    // 5. Sync to Firestore if authenticated session active
    try {
      if (db && auth.currentUser && auth.currentUser.uid === currentUser.id) {
        setDoc(
          doc(db, 'users', currentUser.id),
          {
            balance: newBalance,
            lastDepositAt: serverTimestamp(),
            lastPaymentId: paymentId,
            lastOrderId: orderId,
            lastPaymentGateway: 'RAZORPAY',
          },
          { merge: true }
        ).catch(() => {});

        setDoc(
          doc(db, 'transactions', txnId),
          {
            userId: currentUser.id,
            amount: numAmount,
            type: 'TOP_UP',
            gateway: 'RAZORPAY',
            paymentId,
            orderId,
            status: 'COMPLETED',
            createdAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }
    } catch {
      // Safe offline/demo handling
    }

    return {
      success: true,
      message: `Deposit of ₹${numAmount.toLocaleString('en-IN')} credited to your wallet via Razorpay!`,
      balanceAfter: newBalance,
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
    if (currentUser.isSuspended) return false;
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

    // Update user stats & unified balance directly
    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            balance: newBalance,
            totalWagered: u.totalWagered + wager,
            totalWon: u.totalWon + (finalPayout > 0 ? finalPayout : 0),
          };
        }
        return u;
      })
    );

    // Record game round
    const gameRecord: GameRecord = {
      id: `GME-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      game,
      gameName,
      wager,
      multiplier: Number(finalMultiplier.toFixed(2)),
      payout: Number(finalPayout.toFixed(2)),
      profit: Number(finalProfit.toFixed(2)),
      outcome,
      timestamp: exactTime,
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
    setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isSuspended: newSuspendedState } : u));

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

  // Submit Deposit Request Demo
  const submitDepositRequest = (amount: number, referenceNo: string, qrUrl: string): DepositRequest => {
    const newReq: DepositRequest = {
      id: `DEP-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: currentUser?.id || 'GUEST',
      username: currentUser?.username || 'Guest Player',
      amount,
      referenceNo: referenceNo || `REF-${Date.now().toString().slice(-6)}`,
      qrUrl,
      status: 'PENDING',
      createdAt: new Date().toLocaleString(),
    };

    setDepositRequests(prev => [newReq, ...prev]);
    sounds.chipClick();
    return newReq;
  };

  // Admin Process Deposit Request
  const adminProcessDepositRequest = (requestId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    const req = depositRequests.find(r => r.id === requestId);
    if (!req) return;

    const adminId = currentUser?.id || 'ADM-BITORA-01';
    const processedAt = new Date().toLocaleString();

    setDepositRequests(prev =>
      prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            processedAt,
            rejectionReason: action === 'REJECT' ? (reason || 'Simulated verification declined') : undefined,
            adminId,
          };
        }
        return r;
      })
    );

    // If approved, credit user account directly (no cap)
    if (action === 'APPROVE') {
      const target = users.find(u => u.id === req.userId);
      if (target) {
        const addAmount = req.amount;
        const newBal = target.balance + addAmount;

        setUsers(prev => prev.map(u => (u.id === target.id ? { ...u, balance: newBal } : u)));

        // Transaction
        const txn: Transaction = {
          id: `TXN-${Date.now().toString().slice(-6)}`,
          userId: target.id,
          type: 'DEMO_PAYMENT_REQUEST',
          amount: addAmount,
          balanceAfter: newBal,
          status: 'COMPLETED',
          timestamp: processedAt,
          note: `Approved Deposit Request (${req.id})`,
          adminId,
        };
        setTransactions(prev => [txn, ...prev]);
      }
    }

    // Audit Log
    const audit: AdminAuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      adminId,
      targetUserId: req.userId,
      targetUsername: req.username,
      action: action === 'APPROVE' ? 'APPROVE_PAYMENT' : 'REJECT_PAYMENT',
      amount: req.amount,
      reason: reason || `Payment request ${action.toLowerCase()}d by admin`,
      timestamp: processedAt,
    };
    setAuditLogs(prev => [audit, ...prev]);
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
        submitDepositRequest,
        adminProcessDepositRequest,
        ownerPaymentQr,
        updateOwnerPaymentQr,
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
        creditWalletFromRazorpay,
        razorpaySuccessNotification,
        dismissRazorpayNotification,
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

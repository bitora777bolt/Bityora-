export type UserRole = 'player' | 'admin';

export type UserAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'FROZEN' | 'BLOCKED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GameSessionStatus = 'ONLINE' | 'IN_GAME' | 'IDLE' | 'OFFLINE';

export interface User {
  id: string; // e.g. "BIT-782914"
  gameAccountId: string; // Direct connected game account ID, e.g. "BTY-GAME-782914"
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  balance: number; // Max 5000, Min 0
  accountStatus: UserAccountStatus;
  statusReason?: string;
  statusUpdatedAt?: string;
  suspensionExpiresAt?: string;
  riskLevel: RiskLevel;
  violationCount: number;
  illicitActivityFlags: string[];
  currentGame?: string;
  gameSessionStatus: GameSessionStatus;
  lastActivity?: string;
  isSuspended: boolean; // Retained for backwards compatibility (true if accountStatus !== 'ACTIVE')
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond VIP';
  avatar: string;
  createdAt: string;
  totalWagered: number;
  totalWon: number;
}

export type TransactionType =
  | 'TOP_UP'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'ADMIN_GRANT'
  | 'ADMIN_DEDUCT'
  | 'DEMO_PAYMENT_REQUEST'
  | 'GAME_PAYOUT'
  | 'GAME_WAGER'
  | 'GAME_WIN'
  | 'GAME_LOSS';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'REJECTED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  status: TransactionStatus;
  timestamp: string;
  note: string;
  gameName?: string;
  adminId?: string;
}

export interface PendingDeposit {
  id: string;
  userId: string;
  amount: number;
  method: string;
  referenceNo?: string;
  createdAt: number;
  releaseAt: number;
  status: 'PENDING_10_MIN' | 'CLEARED' | 'CANCELLED';
}

export type GameType =
  | 'MINING_RUSH'
  | 'MINES_24X24'
  | 'CHICKEN_ROAD'
  | 'AVIATOR'
  | 'FORTUNE_WHEEL'
  | 'VAULT_PUZZLE'
  | 'TOWER_CLIMB'
  | 'CRYPTO_TRADING'
  | 'FORTUNE_TIGER'
  | 'EUROPEAN_ROULETTE'
  | 'MATKA_POKER'
  | 'DIAMOND_MINES'
  | 'CANDY_BONANZA'
  | 'LOTTERY_MEGA';

export interface GameRecord {
  id: string;
  userId: string;
  gameAccountId?: string;
  username?: string;
  game: GameType;
  gameName: string;
  wager: number;
  multiplier: number;
  payout: number;
  profit: number;
  outcome: 'WIN' | 'LOSS';
  timestamp: string;
  details?: string;
  riskFlag?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  referenceNo: string;
  qrUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  processedAt?: string;
  rejectionReason?: string;
  adminId?: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  targetUserId: string;
  targetUsername: string;
  action:
    | 'GRANT_CREDITS'
    | 'DEDUCT_CREDITS'
    | 'SUSPEND_ACCOUNT'
    | 'UNSUSPEND_ACCOUNT'
    | 'FREEZE_ACCOUNT'
    | 'UNFREEZE_ACCOUNT'
    | 'BLOCK_ACCOUNT'
    | 'UNBLOCK_ACCOUNT'
    | 'FLAG_VIOLATION'
    | 'APPROVE_PAYMENT'
    | 'REJECT_PAYMENT';
  amount?: number;
  reason: string;
  policyViolationType?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DailyCheckInReward {
  day: number; // 1 to 7
  credits: number; // Incremental for days 1-6, peaking at 6 on day 7
  title: string;
  badge?: string;
  isPeak?: boolean;
}

export interface DailyCheckInState {
  currentDay: number; // 1 to 7
  lastClaimDate: string | null; // 'YYYY-MM-DD'
  streak: number; // Current consecutive streak count
  totalClaimedCredits: number;
  hasClaimedToday: boolean;
  nextRewardInHours?: number;
}


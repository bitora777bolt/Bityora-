export type UserRole = 'player' | 'admin';

export interface User {
  id: string; // e.g. "BIT-782914"
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  balance: number; // Max 5000, Min 0
  isSuspended: boolean;
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
  game: GameType;
  gameName: string;
  wager: number;
  multiplier: number;
  payout: number;
  profit: number;
  outcome: 'WIN' | 'LOSS';
  timestamp: string;
  details?: string;
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
  action: 'GRANT_CREDITS' | 'DEDUCT_CREDITS' | 'SUSPEND_ACCOUNT' | 'UNSUSPEND_ACCOUNT' | 'APPROVE_PAYMENT' | 'REJECT_PAYMENT';
  amount?: number;
  reason: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

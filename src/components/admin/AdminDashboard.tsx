import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Shield,
  Search,
  UserCheck,
  UserX,
  PlusCircle,
  MinusCircle,
  Coins,
  AlertTriangle,
  CheckCircle,
  Lock,
  ArrowRight,
  FileText,
  Clock,
  Eye,
  X,
  QrCode,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  Download,
  Snowflake,
  ShieldAlert,
  Gamepad2,
  Activity,
  Radio,
  FileCode,
  Copy,
  Check,
  TrendingUp,
  AlertOctagon,
  Ban,
  Sliders,
} from 'lucide-react';
import { User, UserAccountStatus, RiskLevel, GameRecord } from '../../types';

interface AdminDashboardProps {
  onOpenExport?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenExport }) => {
  const {
    currentUser,
    users,
    auditLogs,
    depositRequests,
    gameHistory,
    loginAs,
    adminGrantCredits,
    adminDeductCredits,
    adminToggleSuspension,
    adminSetAccountStatus,
    adminFlagIllicitBehavior,
    adminProcessDepositRequest,
    ownerPaymentQr,
    updateOwnerPaymentQr,
  } = useGame();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserAccountStatus | 'HIGH_RISK'>('ALL');
  
  // Modals & Active selections
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'GRANT' | 'DEDUCT' | 'STATUS_CHANGE' | 'FLAG_VIOLATION' | 'INSPECT_ACTIVITY' | null>(null);
  
  // Status Change form state
  const [targetNewStatus, setTargetNewStatus] = useState<UserAccountStatus>('FROZEN');
  const [statusReason, setStatusReason] = useState<string>('');
  const [suspensionHours, setSuspensionHours] = useState<number>(24);
  const [violationType, setViolationType] = useState<string>('Botting / Automation');

  // Credit adjustment state
  const [adjustAmount, setAdjustAmount] = useState<number>(500);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Flag violation form state
  const [flagTag, setFlagTag] = useState<string>('Unusual betting velocity (>15 bets/min)');
  const [flagDetails, setFlagDetails] = useState<string>('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'audit' | 'prompt' | 'deposits' | 'scanner'>('users');
  
  // In-Game Activity filter
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [activityGameFilter, setActivityGameFilter] = useState<string>('ALL');

  // Scanner state
  const [newQrInputUrl, setNewQrInputUrl] = useState<string>('');
  const [scannerSuccessMsg, setScannerSuccessMsg] = useState<string | null>(null);

  // System Prompt copy state
  const [promptCopied, setPromptCopied] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // If not admin, show login gate
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-[#0e121a] border border-[#d4af37]/40 rounded-3xl p-8 text-center shadow-2xl space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-cinzel text-xl font-black text-white">
              Administrator Portal Gate
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Role-Based Access Control: Restricted to authorized BITORA supervisors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121622] border border-[#242c3d] text-left text-xs space-y-2">
            <div className="flex justify-between text-gray-400">
              <span>Required Role:</span>
              <span className="font-bold text-amber-400">admin</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Your Current Role:</span>
              <span className="font-bold text-gray-300">{currentUser?.role.toUpperCase() || 'GUEST'}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Your Current ID:</span>
              <span className="font-mono-numbers text-[#f5d061]">{currentUser?.id || '-'}</span>
            </div>
          </div>

          <p className="text-xs text-red-400 font-semibold text-center">
            Access Restricted: Please sign in with an authorized administrator account to manage this portal.
          </p>
        </div>
      </div>
    );
  }

  // Filtered users by ID, Game Account ID, or username
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.gameAccountId && u.gameAccountId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'HIGH_RISK') return u.riskLevel === 'HIGH' || u.riskLevel === 'CRITICAL' || u.violationCount > 0;
    return u.accountStatus === statusFilter;
  });

  const totalCirculating = users.reduce((acc, u) => acc + u.balance, 0);
  const totalActive = users.filter(u => u.accountStatus === 'ACTIVE').length;
  const totalFrozen = users.filter(u => u.accountStatus === 'FROZEN').length;
  const totalSuspended = users.filter(u => u.accountStatus === 'SUSPENDED').length;
  const totalBlocked = users.filter(u => u.accountStatus === 'BLOCKED').length;
  const totalInGame = users.filter(u => u.gameSessionStatus === 'IN_GAME').length;
  const pendingRequests = depositRequests.filter(r => r.status === 'PENDING').length;

  // Filtered in-game activities
  const filteredActivities = gameHistory.filter(g => {
    const matchesSearch =
      activitySearch === '' ||
      g.userId.toLowerCase().includes(activitySearch.toLowerCase()) ||
      (g.gameAccountId && g.gameAccountId.toLowerCase().includes(activitySearch.toLowerCase())) ||
      (g.username && g.username.toLowerCase().includes(activitySearch.toLowerCase())) ||
      g.gameName.toLowerCase().includes(activitySearch.toLowerCase());

    const matchesGame = activityGameFilter === 'ALL' || g.game === activityGameFilter;
    return matchesSearch && matchesGame;
  });

  // Handle Execute Status Change (Freeze, Suspend, Block, Reactivate)
  const handleExecuteStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;

    if (!statusReason.trim()) {
      setFeedback({ type: 'error', text: 'Please specify an official reason or violation policy note.' });
      return;
    }

    const res = adminSetAccountStatus(
      selectedUserForAction.id,
      targetNewStatus,
      statusReason,
      violationType,
      targetNewStatus === 'SUSPENDED' ? suspensionHours : undefined
    );

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        setSelectedUserForAction(null);
        setActionType(null);
        setStatusReason('');
      }, 1200);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  // Handle Execute Flag Violation
  const handleExecuteFlagViolation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;

    const res = adminFlagIllicitBehavior(
      selectedUserForAction.id,
      flagTag,
      flagDetails || 'Flagged by supervisor audit review'
    );

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        setSelectedUserForAction(null);
        setActionType(null);
        setFlagDetails('');
      }, 1200);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  // Handle Execute Credit Adjustment
  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;

    if (adjustAmount <= 0) {
      setFeedback({ type: 'error', text: 'Adjustment amount must be greater than zero.' });
      return;
    }

    if (actionType === 'GRANT') {
      const res = adminGrantCredits(
        selectedUserForAction.id,
        adjustAmount,
        adjustReason || 'Administrator demo credit provision'
      );
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setTimeout(() => {
          setSelectedUserForAction(null);
          setActionType(null);
          setAdjustReason('');
        }, 1200);
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } else if (actionType === 'DEDUCT') {
      const res = adminDeductCredits(
        selectedUserForAction.id,
        adjustAmount,
        adjustReason || 'Administrator demo credit deduction'
      );
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setTimeout(() => {
          setSelectedUserForAction(null);
          setActionType(null);
          setAdjustReason('');
        }, 1200);
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    }
  };

  const copyPromptText = () => {
    const promptText = `SYSTEM PROMPT: BITYORA USER IDENTIFICATION & ADMINISTRATOR AUTHORITY DIRECTIVE
1. Every registered user receives an immutable Unique User ID (Format: BIT-XXXXXX), linked 1:1 with their Firebase Auth UID and direct game account credentials (BTY-GAME-XXXXXX).
2. All game titles stream real-time in-game telemetry to the connected game account, allowing continuous anti-fraud monitoring of wagers, win rates, and betting velocity.
3. The platform administrator holds full sovereign authority to track, suspend, freeze (asset & betting lock), or permanently block any User ID found engaging in illicit behavior or terms violations.`;
    navigator.clipboard.writeText(promptText);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0e121a] border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                Admin Sovereign Authority Suite
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                OFFICER: {currentUser.id}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              User ID Management &bull; Connected Game Accounts &bull; Live In-Game Surveillance &bull; Enforcement Engine
            </p>
          </div>
        </div>

        {/* Circulating credits & Admin Export Action */}
        <div className="flex items-center gap-3">
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#f5d061]/20 to-amber-500/15 hover:from-amber-500/25 hover:to-[#f5d061]/30 border border-[#d4af37]/50 text-[#f5d061] text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
              title="Export Project Source & Free Hosting Guide"
            >
              <Download className="w-4 h-4 text-[#d4af37]" />
              <span>Export &amp; Hosting Guide</span>
            </button>
          )}

          <div className="bg-[#151b26] border border-[#242c3d] rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] text-gray-400 block uppercase font-semibold">Total Circulating</span>
            <span className="font-mono-numbers text-base sm:text-lg font-black text-[#f5d061]">
              ₹{totalCirculating.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Registered Users</span>
          <span className="font-mono-numbers text-xl font-bold text-white mt-1 block">
            {users.length} Unique IDs
          </span>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">{totalActive} Active</span>
        </div>

        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Live In-Game</span>
          <span className="font-mono-numbers text-xl font-bold text-cyan-300 mt-1 block flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            {totalInGame} Connected
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Live Telemetry</span>
        </div>

        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Restricted Accounts</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono-numbers text-lg font-bold text-cyan-400" title="Frozen">
              ❄ {totalFrozen}
            </span>
            <span className="text-gray-600">/</span>
            <span className="font-mono-numbers text-lg font-bold text-amber-400" title="Suspended">
              ⏳ {totalSuspended}
            </span>
            <span className="text-gray-600">/</span>
            <span className="font-mono-numbers text-lg font-bold text-red-500" title="Blocked">
              🚫 {totalBlocked}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Frozen / Susp. / Ban</span>
        </div>

        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Audit Log Entries</span>
          <span className="font-mono-numbers text-xl font-bold text-emerald-400 mt-1 block">
            {auditLogs.length} Actions
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Immutable Trail</span>
        </div>

        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Pending Deposits</span>
          <span className="font-mono-numbers text-xl font-bold text-amber-400 mt-1 block">
            {pendingRequests} Requests
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Verification Queue</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#242c3d] gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          User Authority ({filteredUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'activity'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          Live In-Game Surveillance ({gameHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Trail ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'prompt'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4 text-amber-400" />
          System Prompt &amp; Directive
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'deposits'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Deposit Demo Queue ({depositRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'scanner'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Owner QR Scanner
        </button>
      </div>

      {/* Tab 1: User Authority & Management */}
      {activeTab === 'users' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl space-y-4">
          {/* Search bar & Status Filter Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by User ID (BIT-XXXXXX), Game ID (BTY-GAME-XXXXXX), or username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#121622] border border-[#242c3d] rounded-xl pl-10 pr-4 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Status Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {(['ALL', 'ACTIVE', 'FROZEN', 'SUSPENDED', 'BLOCKED', 'HIGH_RISK'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer shrink-0 ${
                    statusFilter === f
                      ? 'bg-amber-500/20 text-[#f5d061] border-[#d4af37]'
                      : 'bg-[#121622] text-gray-400 border-[#242c3d] hover:text-white'
                  }`}
                >
                  {f === 'ALL'
                    ? 'All Users'
                    : f === 'HIGH_RISK'
                    ? '⚠️ High Risk'
                    : f === 'FROZEN'
                    ? '❄ Frozen'
                    : f === 'SUSPENDED'
                    ? '⏳ Suspended'
                    : f === 'BLOCKED'
                    ? '🚫 Blocked'
                    : '✓ Active'}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[10px]">
                  <th className="py-2.5 px-3">Unique User ID</th>
                  <th className="py-2.5 px-3">Connected Game Account</th>
                  <th className="py-2.5 px-3">Player / Email</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Live Telemetry</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Balance</th>
                  <th className="py-2.5 px-3 text-right">Admin Sovereign Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2535]">
                {filteredUsers.map(u => {
                  const isBlocked = u.accountStatus === 'BLOCKED';
                  const isFrozen = u.accountStatus === 'FROZEN';
                  const isSuspended = u.accountStatus === 'SUSPENDED';

                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      {/* Unique User ID */}
                      <td className="py-3 px-3 font-mono-numbers font-bold text-[#f5d061]">
                        <div className="flex items-center gap-1.5">
                          <span>{u.id}</span>
                          {u.role === 'admin' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              ADMIN
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Connected Game Account */}
                      <td className="py-3 px-3 font-mono-numbers text-cyan-300 text-[11px]">
                        <span className="bg-[#121622] px-2 py-0.5 rounded border border-[#242c3d]">
                          {u.gameAccountId || `BTY-GAME-${u.id.replace(/[^a-zA-Z0-9]/g, '')}`}
                        </span>
                      </td>

                      {/* Player / Email */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img src={u.avatar} alt={u.username} className="w-6 h-6 rounded-md object-cover" />
                          <div>
                            <p className="font-bold text-white">{u.username}</p>
                            <p className="text-[10px] text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-3 px-3">
                        {isBlocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 w-fit">
                            <Ban className="w-3 h-3" /> BLOCKED
                          </span>
                        ) : isFrozen ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 w-fit">
                            <Snowflake className="w-3 h-3" /> FROZEN
                          </span>
                        ) : isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3" /> SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" /> ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Live Telemetry / Session State */}
                      <td className="py-3 px-3 text-[11px]">
                        {u.gameSessionStatus === 'IN_GAME' ? (
                          <div className="flex items-center gap-1 text-cyan-300 font-bold">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span>{u.currentGame || 'In Game'}</span>
                          </div>
                        ) : u.gameSessionStatus === 'ONLINE' ? (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Online</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">{u.lastActivity || 'Offline'}</span>
                        )}
                      </td>

                      {/* Risk Level & Violations */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                              u.riskLevel === 'CRITICAL'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : u.riskLevel === 'HIGH'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                : u.riskLevel === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {u.riskLevel || 'LOW'}
                          </span>
                          {u.violationCount > 0 && (
                            <span className="text-[10px] font-bold text-red-400" title={`${u.violationCount} Violations`}>
                              ({u.violationCount}v)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Balance */}
                      <td className="py-3 px-3 font-mono-numbers font-bold text-white">
                        ₹{u.balance.toLocaleString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect In-Game Activities */}
                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionType('INSPECT_ACTIVITY');
                              setFeedback(null);
                            }}
                            className="p-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/40 border border-cyan-500/30 transition-colors"
                            title="Monitor In-Game Activities"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Sovereign Authority Status Gate (Freeze, Suspend, Block, Reactivate) */}
                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionType('STATUS_CHANGE');
                              setTargetNewStatus(
                                isBlocked ? 'ACTIVE' : isFrozen ? 'ACTIVE' : isSuspended ? 'ACTIVE' : 'FROZEN'
                              );
                              setStatusReason(u.statusReason || '');
                              setFeedback(null);
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isBlocked
                                ? 'bg-red-600/25 text-red-400 hover:bg-red-600/40 border-red-500/40'
                                : isFrozen
                                ? 'bg-cyan-600/25 text-cyan-300 hover:bg-cyan-600/40 border-cyan-500/40'
                                : isSuspended
                                ? 'bg-amber-600/25 text-amber-300 hover:bg-amber-600/40 border-amber-500/40'
                                : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 border-gray-700'
                            }`}
                            title="Authority Status: Freeze, Suspend, or Block"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>

                          {/* Flag Illicit Behavior */}
                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionType('FLAG_VIOLATION');
                              setFeedback(null);
                            }}
                            className="p-1.5 rounded-lg bg-orange-600/20 text-orange-300 hover:bg-orange-600/40 border border-orange-500/30 transition-colors"
                            title="Flag Illicit Behavior / Policy Violation"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          {/* Grant Credits */}
                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionType('GRANT');
                              setFeedback(null);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/30 transition-colors"
                            title="Grant Virtual Credits"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Deduct Credits */}
                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setActionType('DEDUCT');
                              setFeedback(null);
                            }}
                            className="p-1.5 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-500/30 transition-colors"
                            title="Deduct Virtual Credits"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Live In-Game Surveillance */}
      {activeTab === 'activity' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-cinzel text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                Live In-Game Surveillance &amp; Round Telemetry
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Surveillance ledger linked directly to connected game accounts. Anomaly telemetry alerts on suspicious wagers and velocity.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by User ID or Game..."
                  value={activitySearch}
                  onChange={e => setActivitySearch(e.target.value)}
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono-numbers text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <select
                value={activityGameFilter}
                onChange={e => setActivityGameFilter(e.target.value)}
                className="bg-[#121622] border border-[#242c3d] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="ALL">All Games</option>
                <option value="MINES_24X24">Mines 24x24</option>
                <option value="AVIATOR">Aviator / Crash</option>
                <option value="TOWER_CLIMB">Tower Climb</option>
                <option value="CRYPTO_TRADING">Crypto Trading</option>
                <option value="FORTUNE_TIGER">Fortune Tiger</option>
                <option value="EUROPEAN_ROULETTE">Roulette</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[10px]">
                  <th className="py-2.5 px-3">Round ID &amp; Time</th>
                  <th className="py-2.5 px-3">Unique User ID</th>
                  <th className="py-2.5 px-3">Connected Game Account</th>
                  <th className="py-2.5 px-3">Game Title</th>
                  <th className="py-2.5 px-3">Wager</th>
                  <th className="py-2.5 px-3">Multiplier</th>
                  <th className="py-2.5 px-3">Profit / Loss</th>
                  <th className="py-2.5 px-3">Anomaly Telemetry</th>
                  <th className="py-2.5 px-3 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2535]">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">
                      No game rounds matching your surveillance filter.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map(g => {
                    const targetUser = users.find(u => u.id === g.userId);

                    return (
                      <tr key={g.id} className="hover:bg-white/5 transition-colors">
                        {/* Round ID & Time */}
                        <td className="py-3 px-3">
                          <p className="font-mono-numbers font-bold text-gray-300">{g.id}</p>
                          <p className="font-mono-numbers text-[10px] text-gray-500">{g.timestamp}</p>
                        </td>

                        {/* Unique User ID */}
                        <td className="py-3 px-3 font-mono-numbers font-bold text-[#f5d061]">
                          {g.userId}
                          {targetUser && (
                            <p className="text-[10px] text-gray-400 font-sans font-normal">{targetUser.username}</p>
                          )}
                        </td>

                        {/* Connected Game Account */}
                        <td className="py-3 px-3 font-mono-numbers text-cyan-300 text-[11px]">
                          {g.gameAccountId || `BTY-GAME-${g.userId.replace(/[^a-zA-Z0-9]/g, '')}`}
                        </td>

                        {/* Game Title */}
                        <td className="py-3 px-3 font-semibold text-white">
                          <div className="flex items-center gap-1.5">
                            <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>{g.gameName}</span>
                          </div>
                        </td>

                        {/* Wager */}
                        <td className="py-3 px-3 font-mono-numbers text-gray-300">
                          ₹{g.wager.toLocaleString('en-IN')}
                        </td>

                        {/* Multiplier */}
                        <td className="py-3 px-3 font-mono-numbers font-bold text-amber-300">
                          {g.multiplier > 0 ? `${g.multiplier.toFixed(2)}x` : '-'}
                        </td>

                        {/* Profit / Loss */}
                        <td className="py-3 px-3 font-mono-numbers font-bold">
                          {g.profit >= 0 ? (
                            <span className="text-emerald-400">+₹{g.profit.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-red-400">-₹{Math.abs(g.profit).toLocaleString('en-IN')}</span>
                          )}
                        </td>

                        {/* Anomaly Telemetry */}
                        <td className="py-3 px-3">
                          {g.riskFlag ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                              ⚠️ {g.riskFlag}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500">Normal</span>
                          )}
                        </td>

                        {/* Intervention Action */}
                        <td className="py-3 px-3 text-right">
                          {targetUser && (
                            <button
                              onClick={() => {
                                setSelectedUserForAction(targetUser);
                                setActionType('STATUS_CHANGE');
                                setTargetNewStatus('FROZEN');
                                setStatusReason(`Investigating suspicious round ${g.id} on ${g.gameName}`);
                                setFeedback(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-[10px] font-bold transition-colors"
                            >
                              Freeze / Review
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-cinzel text-base font-bold text-white">
                Administrative Audit Log (Official Immutable Trail)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Every action (Freeze, Suspend, Block, Reactivate, Flag, Credit Grant/Deduct) is recorded with Supervisor ID and timestamp.
              </p>
            </div>
            <span className="text-xs font-mono-numbers text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              {auditLogs.length} Verified Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[10px]">
                  <th className="py-2.5 px-3">Audit ID</th>
                  <th className="py-2.5 px-3">Supervisor ID</th>
                  <th className="py-2.5 px-3">Target User ID</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Policy Violation Type</th>
                  <th className="py-2.5 px-3">Justification</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2535]">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono-numbers text-gray-400">{log.id}</td>
                    <td className="py-3 px-3 font-mono-numbers font-bold text-amber-300">{log.adminId}</td>
                    <td className="py-3 px-3 font-mono-numbers text-white font-bold">{log.targetUserId}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          log.action.includes('BLOCK')
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : log.action.includes('FREEZE')
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : log.action.includes('SUSPEND')
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : log.action.includes('GRANT')
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-gray-800 text-gray-300 border border-gray-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] font-semibold text-gray-300">
                      {log.policyViolationType || '-'}
                    </td>
                    <td className="py-3 px-3 text-gray-300 text-[11px] max-w-xs">{log.reason}</td>
                    <td className="py-3 px-3 text-gray-500 font-mono-numbers text-[11px]">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Prompt & Directive */}
      {activeTab === 'prompt' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#242c3d] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-6 h-6 text-amber-400" />
                <h3 className="font-cinzel text-lg font-black text-white">
                  Bityora Gaming Platform System Prompt &amp; Operational Directive
                </h3>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Official protocol governing Unique User ID generation, Connected Game Account linking, anti-fraud surveillance, and administrator sovereign enforcement.
              </p>
            </div>

            <button
              onClick={copyPromptText}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              {promptCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{promptCopied ? 'Directive Copied!' : 'Copy System Directive'}</span>
            </button>
          </div>

          {/* Directive Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#121622] border border-[#242c3d] p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-amber-400 uppercase font-black tracking-wider block">
                Rule 1: Unique User Identification
              </span>
              <p className="text-xs text-gray-300">
                Every registered user on Bityora automatically receives a permanent Unique User ID (<span className="font-mono-numbers text-[#f5d061] font-bold">BIT-XXXXXX</span>). It is mapped directly to their authentication record and persists across all gameplay sessions and transactions.
              </p>
            </div>

            <div className="bg-[#121622] border border-[#242c3d] p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-cyan-400 uppercase font-black tracking-wider block">
                Rule 2: Direct Connected Game Account Linking
              </span>
              <p className="text-xs text-gray-300">
                The Unique User ID links directly to a Connected Game Account (<span className="font-mono-numbers text-cyan-300 font-bold">BTY-GAME-XXXXXX</span>). All wagers, multipliers, and rounds are bound to this account, enabling live telemetry and session surveillance.
              </p>
            </div>

            <div className="bg-[#121622] border border-[#242c3d] p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider block">
                Rule 3: In-Game Activity Surveillance
              </span>
              <p className="text-xs text-gray-300">
                Administrators continuously monitor in-game telemetry including betting velocity, high multiplier surges (&ge;20x), large wager spikes, and concurrent sessions to proactively identify illicit behavior.
              </p>
            </div>

            <div className="bg-[#121622] border border-[#242c3d] p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-red-400 uppercase font-black tracking-wider block">
                Rule 4: Sovereign Administrative Authority
              </span>
              <p className="text-xs text-gray-300">
                The administrator holds full authority to track any user, enforce <span className="text-cyan-300 font-bold">FREEZE</span> (asset &amp; betting lock), <span className="text-amber-400 font-bold">SUSPEND</span> (temporary lockout), or <span className="text-red-400 font-bold">BLOCK</span> (permanent ban) on accounts violating platform policies.
              </p>
            </div>
          </div>

          {/* Full Markdown Preview */}
          <div className="bg-[#0b0e14] border border-[#242c3d] p-4 rounded-xl text-xs font-mono text-gray-300 space-y-2 max-h-80 overflow-y-auto">
            <p className="text-amber-400 font-bold"># BITYORA GAMING PLATFORM — SYSTEM PROMPT &amp; OPERATIONAL DIRECTIVE</p>
            <p className="text-gray-400">**Document Version:** 2.4.0-PROD | **Authority:** Governance Directorate</p>
            <p className="text-gray-300">
              Every registered user receives a permanent unique user ID (BIT-XXXXXX) mapped 1:1 with their Firebase Auth UID and direct connected game account (BTY-GAME-XXXXXX).
            </p>
            <p className="text-gray-300">
              Admins possess sovereign authority to track, freeze, suspend, or permanently terminate accounts violating integrity standards.
            </p>
          </div>
        </div>
      )}

      {/* Tab 5: Deposit Demo Queue */}
      {activeTab === 'deposits' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-cinzel text-base font-bold text-white">Deposit Verification Queue</h3>
              <p className="text-xs text-gray-400">Review, verify, and approve/reject manual QR deposit submissions.</p>
            </div>
            <span className="text-xs font-mono-numbers text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
              {depositRequests.length} Total Requests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[10px]">
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Reference No</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2535]">
                {depositRequests.map(r => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono-numbers text-gray-400">{r.id}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-white">{r.username}</p>
                      <p className="font-mono-numbers text-[10px] text-[#f5d061]">{r.userId}</p>
                    </td>
                    <td className="py-3 px-3 font-mono-numbers font-bold text-emerald-400">
                      ₹{r.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-mono-numbers text-gray-300">{r.referenceNo}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : r.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-[11px]">{r.createdAt}</td>
                    <td className="py-3 px-3 text-right">
                      {r.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => adminProcessDepositRequest(r.id, 'APPROVE')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/30 text-[11px] font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => adminProcessDepositRequest(r.id, 'REJECT', 'Declined in supervisor review')}
                            className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-500/30 text-[11px] font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Owner Payment QR Scanner */}
      {activeTab === 'scanner' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-cinzel text-base font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" />
              Owner Payment QR Scanner Control
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Configure the master UPI scanner image displayed to players across all top-up modals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-[#121622] border border-[#242c3d]">
            <img
              src={ownerPaymentQr || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=bitora.casino@upi'}
              alt="Active Owner Payment QR"
              className="w-36 h-36 rounded-xl border border-amber-500/40 object-cover bg-white p-1"
            />
            <div className="space-y-2 flex-1">
              <span className="text-xs font-bold text-white block">Current Scanner Configuration</span>
              <p className="text-xs text-gray-400">
                Status: <span className="text-emerald-400 font-bold">{ownerPaymentQr ? 'Custom Image Active' : 'Default Platform QR'}</span>
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste direct image URL for new QR scanner..."
                  value={newQrInputUrl}
                  onChange={e => setNewQrInputUrl(e.target.value)}
                  className="flex-1 bg-[#0b0e14] border border-[#242c3d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
                <button
                  onClick={() => {
                    if (newQrInputUrl.trim()) {
                      updateOwnerPaymentQr(newQrInputUrl.trim());
                      setScannerSuccessMsg('Master QR scanner successfully updated!');
                      setTimeout(() => setScannerSuccessMsg(null), 3000);
                      setNewQrInputUrl('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors shrink-0"
                >
                  Update QR
                </button>
              </div>
              {scannerSuccessMsg && <p className="text-xs text-emerald-400 font-bold">{scannerSuccessMsg}</p>}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SOVEREIGN STATUS CHANGE (Freeze, Suspend, Block, Reactivate) */}
      {actionType === 'STATUS_CHANGE' && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border-2 border-amber-500/50 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-5 animate-scaleUp">
            <button
              onClick={() => {
                setSelectedUserForAction(null);
                setActionType(null);
                setFeedback(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-black text-white">
                  Executive Authority Enforcement
                </h3>
                <p className="text-xs text-gray-400">
                  Target User: <span className="font-mono-numbers text-[#f5d061] font-bold">{selectedUserForAction.id}</span> ({selectedUserForAction.username})
                </p>
                <p className="text-[11px] text-cyan-300 font-mono-numbers">
                  Game Account: {selectedUserForAction.gameAccountId}
                </p>
              </div>
            </div>

            <form onSubmit={handleExecuteStatusChange} className="space-y-4 text-xs">
              {/* Select Status */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1.5">Enforcement Action Tier:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetNewStatus('ACTIVE')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      targetNewStatus === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold'
                        : 'bg-[#121622] text-gray-400 border-[#242c3d]'
                    }`}
                  >
                    ✓ ACTIVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetNewStatus('FROZEN')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      targetNewStatus === 'FROZEN'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold'
                        : 'bg-[#121622] text-gray-400 border-[#242c3d]'
                    }`}
                  >
                    ❄ FREEZE
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetNewStatus('SUSPENDED')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      targetNewStatus === 'SUSPENDED'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                        : 'bg-[#121622] text-gray-400 border-[#242c3d]'
                    }`}
                  >
                    ⏳ SUSPEND
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetNewStatus('BLOCKED')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      targetNewStatus === 'BLOCKED'
                        ? 'bg-red-500/20 text-red-400 border-red-500/60 font-bold'
                        : 'bg-[#121622] text-gray-400 border-[#242c3d]'
                    }`}
                  >
                    🚫 BLOCK
                  </button>
                </div>
              </div>

              {/* Policy Violation Category */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Policy Violation Category:</label>
                <select
                  value={violationType}
                  onChange={e => setViolationType(e.target.value)}
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="Botting / Automation">Botting / Automated Gameplay Script</option>
                  <option value="Rapid Betting Velocity">Rapid Betting Velocity (&gt;15 bets/min)</option>
                  <option value="Exploit Attempt">Game State Exploit Attempt</option>
                  <option value="Multi-Accounting">Multi-Accounting / Sybil Activity</option>
                  <option value="Payment / Arbitrage Fraud">Payment / Arbitrage Turnover Abuse</option>
                  <option value="Terms of Service Violation">Severe Terms of Service Section 8 Violation</option>
                  <option value="Routine Compliance Check">Routine Anti-Fraud Compliance Verification</option>
                </select>
              </div>

              {/* Suspension Duration if suspended */}
              {targetNewStatus === 'SUSPENDED' && (
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Suspension Period (Hours):</label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={suspensionHours}
                    onChange={e => setSuspensionHours(Number(e.target.value))}
                    className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3 py-2 text-white font-mono-numbers focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              )}

              {/* Justification Reason */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Official Supervisor Reason / Notice to User:</label>
                <textarea
                  rows={3}
                  value={statusReason}
                  onChange={e => setStatusReason(e.target.value)}
                  placeholder="Explain the illicit behavior or policy violation justification..."
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37]"
                  required
                />
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForAction(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold transition-all shadow-lg"
                >
                  Execute Status Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: USER IN-GAME ACTIVITY INSPECTOR */}
      {actionType === 'INSPECT_ACTIVITY' && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border-2 border-cyan-500/40 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative space-y-5 max-h-[90vh] flex flex-col">
            <button
              onClick={() => {
                setSelectedUserForAction(null);
                setActionType(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-black text-white">
                  User In-Game Activity &amp; Account Telemetry
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono-numbers text-xs font-bold text-[#f5d061]">
                    {selectedUserForAction.id}
                  </span>
                  <span className="text-gray-500">&bull;</span>
                  <span className="font-mono-numbers text-xs text-cyan-300">
                    {selectedUserForAction.gameAccountId}
                  </span>
                  <span className="text-gray-500">&bull;</span>
                  <span className="text-xs text-gray-300">{selectedUserForAction.username}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="bg-[#121622] p-3 rounded-xl border border-[#242c3d]">
                <span className="text-[10px] text-gray-400 block uppercase">Total Wagered</span>
                <span className="font-mono-numbers font-bold text-white text-sm">
                  ₹{selectedUserForAction.totalWagered.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-[#121622] p-3 rounded-xl border border-[#242c3d]">
                <span className="text-[10px] text-gray-400 block uppercase">Total Won</span>
                <span className="font-mono-numbers font-bold text-emerald-400 text-sm">
                  ₹{selectedUserForAction.totalWon.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-[#121622] p-3 rounded-xl border border-[#242c3d]">
                <span className="text-[10px] text-gray-400 block uppercase">Risk Tier</span>
                <span className="font-bold text-amber-300 text-sm">
                  {selectedUserForAction.riskLevel}
                </span>
              </div>
              <div className="bg-[#121622] p-3 rounded-xl border border-[#242c3d]">
                <span className="text-[10px] text-gray-400 block uppercase">Account Status</span>
                <span className="font-bold text-cyan-300 text-sm">
                  {selectedUserForAction.accountStatus}
                </span>
              </div>
            </div>

            {/* Activity Rounds Table */}
            <div className="flex-1 overflow-y-auto border border-[#242c3d] rounded-xl">
              {gameHistory.filter(g => g.userId === selectedUserForAction.id).length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No registered in-game rounds found for this account yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[10px] bg-[#121622]">
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-3">Game</th>
                      <th className="py-2 px-3">Wager</th>
                      <th className="py-2 px-3">Multiplier</th>
                      <th className="py-2 px-3">Profit</th>
                      <th className="py-2 px-3">Anomaly</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2535]">
                    {gameHistory
                      .filter(g => g.userId === selectedUserForAction.id)
                      .map(g => (
                        <tr key={g.id} className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-mono-numbers text-gray-400 text-[11px]">{g.timestamp}</td>
                          <td className="py-2.5 px-3 font-bold text-white">{g.gameName}</td>
                          <td className="py-2.5 px-3 font-mono-numbers text-gray-300">₹{g.wager}</td>
                          <td className="py-2.5 px-3 font-mono-numbers text-amber-300">{g.multiplier.toFixed(2)}x</td>
                          <td className="py-2.5 px-3 font-mono-numbers font-bold">
                            {g.profit >= 0 ? (
                              <span className="text-emerald-400">+₹{g.profit}</span>
                            ) : (
                              <span className="text-red-400">-₹{Math.abs(g.profit)}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {g.riskFlag ? (
                              <span className="text-[10px] font-bold text-red-400">⚠️ {g.riskFlag}</span>
                            ) : (
                              <span className="text-[10px] text-gray-500">Normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setActionType('STATUS_CHANGE');
                  setTargetNewStatus(selectedUserForAction.accountStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE');
                  setStatusReason(selectedUserForAction.statusReason || '');
                }}
                className="px-4 py-2 rounded-xl bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-bold hover:bg-red-600/30 transition-colors"
              >
                Change Account Status
              </button>

              <button
                onClick={() => {
                  setSelectedUserForAction(null);
                  setActionType(null);
                }}
                className="px-5 py-2 rounded-xl bg-gray-800 text-gray-300 font-bold text-xs hover:bg-gray-700 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FLAG ILLICIT BEHAVIOR */}
      {actionType === 'FLAG_VIOLATION' && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border-2 border-orange-500/50 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                setSelectedUserForAction(null);
                setActionType(null);
                setFeedback(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-black text-white">Flag Policy Violation</h3>
                <p className="text-xs text-gray-400">Target User: {selectedUserForAction.id}</p>
              </div>
            </div>

            <form onSubmit={handleExecuteFlagViolation} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Violation Tag / Signature:</label>
                <select
                  value={flagTag}
                  onChange={e => setFlagTag(e.target.value)}
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="Unusual betting velocity (>15 bets/min)">Unusual betting velocity (&gt;15 bets/min)</option>
                  <option value="Multi-tab concurrent play">Multi-tab concurrent play</option>
                  <option value="Rapid multiplier withdrawal spike">Rapid multiplier withdrawal spike</option>
                  <option value="Client state manipulation attempt">Client state manipulation attempt</option>
                  <option value="Cyclic deposit/cashout arbitrage">Cyclic deposit/cashout arbitrage</option>
                  <option value="Suspicious device fingerprint">Suspicious device fingerprint</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Investigation Notes:</label>
                <textarea
                  rows={2}
                  value={flagDetails}
                  onChange={e => setFlagDetails(e.target.value)}
                  placeholder="Additional audit notes..."
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {feedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForAction(null);
                    setActionType(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-800 text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors"
                >
                  Add Violation Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREDIT GRANT / DEDUCT */}
      {(actionType === 'GRANT' || actionType === 'DEDUCT') && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border-2 border-amber-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                setSelectedUserForAction(null);
                setActionType(null);
                setFeedback(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  actionType === 'GRANT'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}
              >
                {actionType === 'GRANT' ? <PlusCircle className="w-6 h-6" /> : <MinusCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-cinzel text-base font-black text-white">
                  {actionType === 'GRANT' ? 'Grant Virtual Credits' : 'Deduct Virtual Credits'}
                </h3>
                <p className="text-xs text-gray-400">Target User: {selectedUserForAction.id} ({selectedUserForAction.username})</p>
              </div>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 font-semibold block mb-1">Credit Amount (₹):</label>
                <input
                  type="number"
                  min={1}
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(Number(e.target.value))}
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3 py-2 text-white font-mono-numbers font-bold text-sm focus:outline-none focus:border-[#d4af37]"
                  required
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold block mb-1">Justification Reason:</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Supervisor rationale..."
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {feedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForAction(null);
                    setActionType(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-800 text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl font-bold transition-colors text-white ${
                    actionType === 'GRANT'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  Execute Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

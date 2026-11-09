import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  User as UserIcon,
  Shield,
  Coins,
  History,
  TrendingUp,
  Settings,
  LogOut,
  Copy,
  Check,
  Award,
  Gamepad2,
  Calendar,
  Phone,
  Mail,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { LUXURY_AVATARS } from '../../utils/avatars';
import { isHardcodedAdminEmail } from '../../types';

export const UserProfile: React.FC = () => {
  const {
    currentUser,
    transactions,
    gameHistory,
    logout,
    resetDemoData,
    soundEnabled,
    toggleSound,
    updateProfile,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'transactions' | 'games' | 'settings'>('games');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedGameId, setCopiedGameId] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>(currentUser?.username || '');
  const [editSuccess, setEditSuccess] = useState<boolean>(false);

  if (!currentUser) {
    return (
      <div className="p-12 text-center text-gray-400">
        No active user session. Please log in or switch accounts.
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentUser.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGameId = () => {
    navigator.clipboard.writeText(currentUser.gameAccountId).catch(() => {});
    setCopiedGameId(true);
    setTimeout(() => setCopiedGameId(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      updateProfile({ username: newUsername.trim() });
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 2500);
    }
  };

  // Filter transactions for this user
  const userTxns = transactions.filter(t => t.userId === currentUser.id);
  const userGames = gameHistory.filter(g => g.userId === currentUser.id);

  const netDemoProfit = currentUser.totalWon - currentUser.totalWagered;

  return (
    <div className="space-y-6">
      {/* Top Profile Card */}
      <div className="bg-[#0e121a] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#d4af37] text-black shadow-md uppercase tracking-wider">
                {currentUser.vipTier}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                  {currentUser.username}
                </h1>
                {(currentUser.role === 'admin' || isHardcodedAdminEmail(currentUser.email)) && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                    OFFICER
                  </span>
                )}
                {currentUser.accountStatus === 'BLOCKED' ? (
                  <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold">
                    🚫 BLOCKED
                  </span>
                ) : currentUser.accountStatus === 'FROZEN' ? (
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
                    ❄ FROZEN
                  </span>
                ) : currentUser.accountStatus === 'SUSPENDED' || currentUser.isSuspended ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                    ⏳ SUSPENDED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    ✓ ACTIVE
                  </span>
                )}
              </div>

              {/* Unique User ID & Connected Game Account with 1-click copy */}
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1.5 bg-[#121622] px-2.5 py-1 rounded-lg border border-[#242c3d]">
                  <span className="text-[11px] text-gray-400">User ID:</span>
                  <span className="font-mono-numbers text-xs font-bold text-[#f5d061]">
                    {currentUser.id}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-0.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy Unique User ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-[#121622] px-2.5 py-1 rounded-lg border border-[#242c3d]">
                  <span className="text-[11px] text-gray-400">Connected Game Account:</span>
                  <span className="font-mono-numbers text-xs font-bold text-cyan-300">
                    {currentUser.gameAccountId || `BTY-GAME-${currentUser.id.replace(/[^a-zA-Z0-9]/g, '')}`}
                  </span>
                  <button
                    onClick={handleCopyGameId}
                    className="p-0.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy Connected Game Account ID"
                  >
                    {copiedGameId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2 font-mono-numbers">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-500" /> {currentUser.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-500" /> {currentUser.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-500" /> Member since {currentUser.createdAt}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Balance Status Card */}
          <div className="bg-[#121622] border border-[#242c3d] rounded-2xl p-4 min-w-[220px] shadow-inner space-y-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">
              Virtual Credit Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-numbers text-2xl font-black text-[#f5d061]">
                ₹{currentUser.balance.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-500 font-mono-numbers">/ ₹5,000 max</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-[#090c12] rounded-full overflow-hidden border border-[#242c3d]">
              <div
                className="h-full bg-gradient-to-r from-[#d4af37] to-emerald-400 rounded-full"
                style={{ width: `${Math.min(100, (currentUser.balance / 5000) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#242c3d]">
          <div className="bg-[#121622] rounded-xl p-3 border border-[#242c3d]">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Demo Wagered</span>
            <span className="font-mono-numbers text-base font-bold text-white">
              ₹{currentUser.totalWagered.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#121622] rounded-xl p-3 border border-[#242c3d]">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Demo Won</span>
            <span className="font-mono-numbers text-base font-bold text-emerald-400">
              ₹{currentUser.totalWon.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#121622] rounded-xl p-3 border border-[#242c3d]">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Net Simulation P&amp;L</span>
            <span
              className={`font-mono-numbers text-base font-bold ${
                netDemoProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {netDemoProfit >= 0 ? `+₹${netDemoProfit.toLocaleString('en-IN')}` : `-₹${Math.abs(netDemoProfit).toLocaleString('en-IN')}`}
            </span>
          </div>

          <div className="bg-[#121622] rounded-xl p-3 border border-[#242c3d]">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Rounds Logged</span>
            <span className="font-mono-numbers text-base font-bold text-[#f5d061]">
              {userGames.length} Games
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[#242c3d] gap-2">
        <button
          onClick={() => setActiveTab('games')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'games'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          Demo Game History ({userGames.length})
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'transactions'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          Transaction Log ({userTxns.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'settings'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings &amp; Preferences
        </button>
      </div>

      {/* Tab 1: Game History */}
      {activeTab === 'games' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl">
          <h3 className="font-cinzel text-base font-bold text-white mb-4">
            Recent Demo Game Rounds
          </h3>
          {userGames.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">No game rounds recorded yet. Play Mines, Chicken Road, or Aviator to see records here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[10px]">
                    <th className="py-2.5 px-3">Round ID</th>
                    <th className="py-2.5 px-3">Game</th>
                    <th className="py-2.5 px-3">Wager</th>
                    <th className="py-2.5 px-3">Multiplier</th>
                    <th className="py-2.5 px-3">Payout</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Details</th>
                    <th className="py-2.5 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2535]">
                  {userGames.map(g => (
                    <tr key={g.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono-numbers text-gray-400">{g.id}</td>
                      <td className="py-3 px-3 font-bold text-white">{g.gameName}</td>
                      <td className="py-3 px-3 font-mono-numbers text-gray-300">₹{g.wager}</td>
                      <td className="py-3 px-3 font-mono-numbers font-bold text-[#f5d061]">{g.multiplier.toFixed(2)}x</td>
                      <td className="py-3 px-3 font-mono-numbers font-bold text-emerald-400">₹{g.payout.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            g.outcome === 'WIN'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {g.outcome}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-400 text-[11px] truncate max-w-[200px]">{g.details || '-'}</td>
                      <td className="py-3 px-3 text-gray-500 font-mono-numbers text-[11px]">{g.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Transaction History */}
      {activeTab === 'transactions' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl">
          <h3 className="font-cinzel text-base font-bold text-white mb-4">
            Virtual Credit Audit &amp; Transactions
          </h3>
          {userTxns.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[10px]">
                    <th className="py-2.5 px-3">Txn ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Balance After</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Note</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2535]">
                  {userTxns.map(t => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono-numbers text-gray-400">{t.id}</td>
                      <td className="py-3 px-3 font-semibold text-white">{t.type}</td>
                      <td className="py-3 px-3 font-mono-numbers font-bold text-[#f5d061]">₹{t.amount}</td>
                      <td className="py-3 px-3 font-mono-numbers text-gray-300">₹{t.balanceAfter}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-400 text-[11px]">{t.note}</td>
                      <td className="py-3 px-3 text-gray-500 font-mono-numbers text-[11px]">{t.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Edit */}
          <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-cinzel text-base font-bold text-white">
              Account Details
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Display Username:
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Email Address:
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-[#121622]/50 border border-[#242c3d] rounded-xl px-3.5 py-2 text-xs text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Choose Player DP (Avatar):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LUXURY_AVATARS.map(av => {
                    const isSelected = currentUser.avatar === av.imageUrl;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => updateProfile({ avatar: av.imageUrl })}
                        className={`p-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#d4af37]/25 border-[#f5d061] text-[#f5d061]'
                            : 'bg-[#121622] border-[#242c3d] text-gray-300 hover:border-[#d4af37]/40'
                        }`}
                      >
                        <img
                          src={av.imageUrl}
                          alt={av.name}
                          className="w-7 h-7 rounded-lg object-cover border border-[#d4af37]/40 shrink-0"
                        />
                        <span className="text-[10px] font-bold truncate">{av.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#d4af37] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] transition-all cursor-pointer"
              >
                Save Changes
              </button>

              {editSuccess && (
                <span className="text-xs text-emerald-400 font-semibold block">
                  Profile updated successfully!
                </span>
              )}
            </form>
          </div>

          {/* Preferences & Reset */}
          <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl space-y-5">
            <h3 className="font-cinzel text-base font-bold text-white">
              Preferences &amp; Safety
            </h3>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#121622] border border-[#242c3d]">
              <div>
                <p className="text-xs font-semibold text-white">Game Audio Synthesizer</p>
                <p className="text-[11px] text-gray-400">Tactile sound effects for games and wins</p>
              </div>
              <button
                onClick={toggleSound}
                className="p-2 rounded-lg bg-[#1a2232] text-gray-300 hover:text-white"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5 text-[#f5d061]" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>

            {/* Reset Demo Data */}
            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
              <p className="text-xs font-bold text-red-400">Reset Local Demo Storage</p>
              <p className="text-[11px] text-gray-400">
                Restores original balances, transactions, and users to initial factory state.
              </p>
              <button
                onClick={resetDemoData}
                className="py-1.5 px-3 rounded-lg text-xs font-bold text-red-300 bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Demo Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

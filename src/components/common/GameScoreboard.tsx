import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { GameType } from '../../types';
import { LUXURY_AVATARS, SIMULATED_PLAYERS } from '../../utils/avatars';
import {
  Trophy,
  Award,
  TrendingUp,
  Flame,
  User as UserIcon,
  Crown,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';

interface GameScoreboardProps {
  gameType: GameType;
  gameTitle: string;
}

interface ScoreboardEntry {
  id: string;
  playerName: string;
  userId: string;
  avatar: string;
  wager: number;
  multiplier: number;
  payout: number;
  profit: number;
  timeAgo: string;
  isCurrentUser?: boolean;
}

export const GameScoreboard: React.FC<GameScoreboardProps> = ({ gameType, gameTitle }) => {
  const { currentUser, gameHistory, updateProfile } = useGame();
  const [activeTab, setActiveTab] = useState<'live' | 'top'>('live');
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  // Filter actual user rounds for this game
  const userRounds = gameHistory.filter(g => g.game === gameType && g.outcome === 'WIN');

  // Generate realistic leaderboard entries for this specific game
  const seedMultiplierBase: Record<GameType, number[]> = {
    MINING_RUSH: [350.0, 75.0, 28.5, 12.0, 5.5, 2.8],
    MINES_24X24: [6.45, 4.20, 3.10, 2.45, 8.80, 5.12],
    FORTUNE_WHEEL: [25.0, 10.0, 5.0, 3.0, 3.0, 2.0],
    VAULT_PUZZLE: [10.0, 5.0, 3.0, 3.0, 2.0, 1.5],
    CHICKEN_ROAD: [65.0, 30.0, 16.5, 9.8, 6.2, 4.1],
    AVIATOR: [18.42, 12.10, 7.85, 4.50, 3.20, 2.15],
    TOWER_CLIMB: [26.00, 17.00, 11.20, 7.40, 4.90, 3.25],
    CRYPTO_TRADING: [4.80, 3.20, 2.45, 1.95, 1.85, 2.90],
    FORTUNE_TIGER: [250.0, 50.0, 25.0, 10.0, 5.0, 2.5],
    EUROPEAN_ROULETTE: [36.0, 18.0, 3.0, 2.0, 2.0, 3.0],
    MATKA_POKER: [90.0, 30.0, 15.0, 9.0, 5.0, 2.0],
    DIAMOND_MINES: [18.5, 9.2, 5.4, 3.1, 2.2, 1.6],
    CANDY_BONANZA: [100.0, 25.0, 12.0, 6.5, 3.5, 2.0],
    LOTTERY_MEGA: [500.0, 100.0, 20.0, 5.0, 2.0, 1.5],
  };

  const multipliers = seedMultiplierBase[gameType] || [5.0, 3.0, 2.5, 2.0];

  // Seeded players with Money Dollar, Ferrari, BMW, Money Dog, and INR avatars
  const simulatedEntries: ScoreboardEntry[] = SIMULATED_PLAYERS.map((sim, i) => {
    const mult = multipliers[i % multipliers.length];
    const wager = (i % 2 === 0 ? 100 : 50) + (i * 10);
    const payout = Math.round(wager * mult);
    return {
      id: `sim-${i}`,
      playerName: sim.name,
      userId: sim.id,
      avatar: sim.avatar,
      wager,
      multiplier: mult,
      payout,
      profit: payout - wager,
      timeAgo: `${(i + 1) * 2}m ago`,
    };
  });

  // Include user's actual winning rounds if available
  const userEntries: ScoreboardEntry[] = userRounds.slice(0, 3).map((r, i) => ({
    id: `usr-${r.id}`,
    playerName: currentUser?.username || 'You (VIP)',
    userId: currentUser?.id || 'BIT-782914',
    avatar: currentUser?.avatar || LUXURY_AVATARS[0].imageUrl,
    wager: r.wager,
    multiplier: r.multiplier,
    payout: r.payout,
    profit: r.profit,
    timeAgo: i === 0 ? 'Just now' : `${i * 3}m ago`,
    isCurrentUser: true,
  }));

  // Combined & sorted
  const allEntries = [...userEntries, ...simulatedEntries];

  const displayedEntries =
    activeTab === 'top'
      ? [...allEntries].sort((a, b) => b.payout - a.payout).slice(0, 6)
      : allEntries.slice(0, 6);

  return (
    <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Scoreboard Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242c3d] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-[#d4af37] flex items-center justify-center text-black font-bold shadow-md">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-cinzel text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>{gameTitle} Live Scoreboard</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-gray-400 font-mono-numbers">
              Real-time High-Roller Wins &amp; Player DPs
            </p>
          </div>
        </div>

        {/* Tab Switcher & Avatar Customizer */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#121622] p-0.5 rounded-lg border border-[#242c3d] text-[10px] font-bold">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'live'
                  ? 'bg-[#d4af37] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Live Wins
            </button>
            <button
              onClick={() => setActiveTab('top')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === 'top'
                  ? 'bg-[#d4af37] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Top Payouts
            </button>
          </div>

          {/* Quick DP Selector Button */}
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#151b26] border border-[#d4af37]/40 hover:border-[#f5d061] text-[10px] font-bold text-[#f5d061] transition-all cursor-pointer"
            title="Change your Player DP (Ferrari, BMW, Money Dog, Dollar, INR)"
          >
            <img
              src={currentUser?.avatar || LUXURY_AVATARS[0].imageUrl}
              alt="My DP"
              className="w-4 h-4 rounded-full object-cover border border-[#d4af37]"
            />
            <span className="hidden sm:inline">Change DP</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Avatar Picker Dropdown */}
      {showAvatarPicker && (
        <div className="p-3 bg-[#121622] border border-[#d4af37]/40 rounded-xl space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
              Select Your Luxury Player DP:
            </span>
            <button
              onClick={() => setShowAvatarPicker(false)}
              className="text-[10px] text-gray-500 hover:text-white"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {LUXURY_AVATARS.map(avatar => {
              const isSelected = currentUser?.avatar === avatar.imageUrl;

              return (
                <button
                  key={avatar.id}
                  onClick={() => {
                    updateProfile({ avatar: avatar.imageUrl });
                    setShowAvatarPicker(false);
                  }}
                  className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#d4af37]/20 border-[#f5d061] shadow-md'
                      : 'bg-[#151b26] border-[#242c3d] hover:border-[#d4af37]/50'
                  }`}
                >
                  <img
                    src={avatar.imageUrl}
                    alt={avatar.name}
                    className="w-9 h-9 rounded-lg object-cover border border-[#d4af37]/30"
                  />
                  <span className="text-[9px] font-bold text-gray-300 truncate max-w-[65px]">
                    {avatar.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scoreboard List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[9px]">
              <th className="py-1.5 px-2">Rank</th>
              <th className="py-1.5 px-2">Player &amp; DP</th>
              <th className="py-1.5 px-2">Wager</th>
              <th className="py-1.5 px-2">Multiplier</th>
              <th className="py-1.5 px-2">Points Won</th>
              <th className="py-1.5 px-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#192130]">
            {displayedEntries.map((entry, idx) => {
              const isTop3 = idx < 3;
              const rankColor =
                idx === 0
                  ? 'text-[#f5d061] font-black'
                  : idx === 1
                  ? 'text-gray-300 font-bold'
                  : idx === 2
                  ? 'text-amber-600 font-bold'
                  : 'text-gray-500';

              return (
                <tr
                  key={entry.id}
                  className={`transition-colors ${
                    entry.isCurrentUser
                      ? 'bg-[#d4af37]/10 hover:bg-[#d4af37]/15 border-l-2 border-l-[#d4af37]'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-2.5 px-2 font-mono-numbers">
                    <span className={rankColor}>
                      {idx === 0 ? '👑 #1' : `#${idx + 1}`}
                    </span>
                  </td>

                  {/* Player DP & Name */}
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="relative shrink-0">
                        <img
                          src={entry.avatar}
                          alt={entry.playerName}
                          className="w-7 h-7 rounded-lg object-cover border border-[#d4af37]/40 shadow-sm"
                        />
                        {isTop3 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 flex items-center justify-center text-[7px] text-black font-black">
                            ★
                          </span>
                        )}
                      </div>
                      <div className="truncate max-w-[130px] sm:max-w-[180px]">
                        <p className="font-bold text-white text-[11px] truncate leading-tight">
                          {entry.playerName}
                          {entry.isCurrentUser && (
                            <span className="ml-1 text-[9px] text-[#f5d061] font-bold">(You)</span>
                          )}
                        </p>
                        <p className="text-[9px] text-gray-500 font-mono-numbers truncate">
                          {entry.userId}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Wager */}
                  <td className="py-2.5 px-2 font-mono-numbers text-gray-400 text-[11px]">
                    ₹{entry.wager}
                  </td>

                  {/* Multiplier */}
                  <td className="py-2.5 px-2 font-mono-numbers font-bold text-[#f5d061] text-[11px]">
                    {entry.multiplier.toFixed(2)}x
                  </td>

                  {/* Points Won */}
                  <td className="py-2.5 px-2 font-mono-numbers font-black text-emerald-400 text-xs">
                    +₹{entry.payout.toLocaleString('en-IN')}
                  </td>

                  {/* Time */}
                  <td className="py-2.5 px-2 text-right text-gray-500 font-mono-numbers text-[10px]">
                    {entry.timeAgo}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

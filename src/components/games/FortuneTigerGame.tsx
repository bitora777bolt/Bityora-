import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { GameScoreboard } from '../common/GameScoreboard';
import { sounds } from '../../utils/soundEffects';
import {
  Sparkles,
  Zap,
  Coins,
  RefreshCw,
  Trophy,
  AlertCircle,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface SymbolDef {
  id: string;
  name: string;
  icon: string;
  payout3: number; // 3 of a kind multiplier
  color: string;
}

const SYMBOLS: SymbolDef[] = [
  { id: 'tiger', name: 'Golden Tiger Wild', icon: '🐯', payout3: 250, color: 'text-amber-300' },
  { id: 'ingot', name: 'Golden Ingot (Sycee)', icon: '🪙', payout3: 50, color: 'text-yellow-400' },
  { id: 'bag', name: 'Money Bag', icon: '💰', payout3: 25, color: 'text-emerald-400' },
  { id: 'envelope', name: 'Lucky Red Pocket', icon: '🧧', payout3: 15, color: 'text-red-400' },
  { id: 'jade', name: 'Jade Fortune Amulet', icon: '🟢', payout3: 10, color: 'text-teal-400' },
  { id: 'oranges', name: 'Mandarin Fortune', icon: '🍊', payout3: 5, color: 'text-orange-400' },
  { id: 'firecracker', name: 'Golden Firecrackers', icon: '🧨', payout3: 3, color: 'text-rose-400' },
];

export const FortuneTigerGame: React.FC = () => {
  const { currentUser, recordGameRound, soundEnabled, toggleSound } = useGame();

  const [wager, setWager] = useState<number>(50);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [grid, setGrid] = useState<string[][]>([
    ['ingot', 'tiger', 'bag'],
    ['envelope', 'oranges', 'jade'],
    ['firecracker', 'ingot', 'tiger'],
  ]);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<number>(0);
  const [lastMultiplier, setLastMultiplier] = useState<number>(0);
  const [tigerStreakActive, setTigerStreakActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const userBalance = currentUser?.balance || 0;

  // Paylines: 5 standard lines on 3x3 grid (3 horizontal, 2 diagonal)
  // [row, col] coords
  const PAYLINES = [
    { id: 1, name: 'Top Row', coords: [[0, 0], [0, 1], [0, 2]] },
    { id: 2, name: 'Middle Row', coords: [[1, 0], [1, 1], [1, 2]] },
    { id: 3, name: 'Bottom Row', coords: [[2, 0], [2, 1], [2, 2]] },
    { id: 4, name: 'Main Diagonal', coords: [[0, 0], [1, 1], [2, 2]] },
    { id: 5, name: 'Anti Diagonal', coords: [[2, 0], [1, 1], [0, 2]] },
  ];

  const getRandomSymbol = () => {
    // Weighted selection (tiger is rarer)
    const roll = Math.random() * 100;
    if (roll < 4) return 'tiger';
    if (roll < 12) return 'ingot';
    if (roll < 25) return 'bag';
    if (roll < 45) return 'envelope';
    if (roll < 65) return 'jade';
    if (roll < 82) return 'oranges';
    return 'firecracker';
  };

  const handleSpin = () => {
    if (isSpinning) return;
    setErrorMsg('');

    if (wager <= 0) {
      setErrorMsg('Please select a valid wager amount!');
      return;
    }

    if (wager > userBalance) {
      setErrorMsg(`Insufficient credits! Your available balance is ₹${userBalance}.`);
      if (soundEnabled) sounds.playBomb();
      return;
    }

    setIsSpinning(true);
    setWinningLines([]);
    setLastWin(0);
    setLastMultiplier(0);
    if (soundEnabled) sounds.playSpin();

    // Trigger visual spinning animation
    let tickCount = 0;
    const maxTicks = 16;

    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

    spinIntervalRef.current = setInterval(() => {
      tickCount++;
      setGrid([
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ]);

      if (tickCount >= maxTicks) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        finalizeSpin();
      }
    }, 80);
  };

  const finalizeSpin = () => {
    // Generate final grid
    const finalGrid: string[][] = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    ];

    // High wager perk: slightly better chance of tiger or ingot
    if (wager >= 100 && Math.random() < 0.28) {
      finalGrid[1][1] = 'tiger'; // center wild
    }

    setGrid(finalGrid);
    setIsSpinning(false);

    // Evaluate paylines
    const matchedLineIds: number[] = [];
    let totalLineMultiplier = 0;

    PAYLINES.forEach((line) => {
      const s1 = finalGrid[line.coords[0][0]][line.coords[0][1]];
      const s2 = finalGrid[line.coords[1][0]][line.coords[1][1]];
      const s3 = finalGrid[line.coords[2][0]][line.coords[2][1]];

      // Check if 3 match (with 'tiger' acting as Wild)
      let matchSymbol: string | null = null;
      const nonWilds = [s1, s2, s3].filter((s) => s !== 'tiger');

      if (nonWilds.length === 0) {
        // All 3 are Wild Tigers!
        matchSymbol = 'tiger';
      } else if (nonWilds.every((s) => s === nonWilds[0])) {
        // All non-wilds are identical
        matchSymbol = nonWilds[0];
      }

      if (matchSymbol) {
        matchedLineIds.push(line.id);
        const def = SYMBOLS.find((s) => s.id === matchSymbol);
        if (def) {
          totalLineMultiplier += def.payout3;
        }
      }
    });

    setWinningLines(matchedLineIds);

    // Tiger Streak bonus multiplier
    const isTigerStreak = matchedLineIds.length >= 2;
    setTigerStreakActive(isTigerStreak);

    if (totalLineMultiplier > 0) {
      if (isTigerStreak) totalLineMultiplier = totalLineMultiplier * 1.5;

      const payout = Math.round(wager * totalLineMultiplier);
      setLastWin(payout);
      setLastMultiplier(totalLineMultiplier);

      // Record Win in context
      recordGameRound('FORTUNE_TIGER', 'Fortune Tiger Slot', wager, totalLineMultiplier, payout, `${matchedLineIds.length} Paylines Hit`);

      if (soundEnabled) {
        if (totalLineMultiplier >= 25) {
          sounds.playBigWin();
        } else {
          sounds.playWin();
        }
      }
    } else {
      // Record Loss in context
      recordGameRound('FORTUNE_TIGER', 'Fortune Tiger Slot', wager, 0, 0, 'No Winning Line');
      if (soundEnabled) sounds.playLoss();
    }
  };

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Game Layout */}
      <div className="bg-[#0c0f17] border border-[#d4af37]/40 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background glow and Asian Imperial aesthetic */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#242c3d] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-red-600 to-amber-700 flex items-center justify-center text-2xl shadow-lg border border-[#f5d061]/50">
              🐯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-wide gold-text-gradient">
                  FORTUNE TIGER
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400">
                  500X MAX
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Play with Credits &bull; 3x3 Golden Reels &bull; Tiger Wilds
              </p>
            </div>
          </div>

          {/* User Paid Points Display */}
          <div className="flex items-center gap-3 bg-[#131826] border border-[#242c3d] px-4 py-2 rounded-2xl">
            <Coins className="w-4 h-4 text-[#f5d061]" />
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Credits Balance</p>
              <p className="text-base font-black text-white font-mono-numbers">
                ₹{userBalance.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Tiger Streak Banner */}
        {tigerStreakActive && (
          <div className="mt-4 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-black font-black text-center py-1.5 px-4 rounded-xl text-xs sm:text-sm tracking-wider uppercase animate-pulse shadow-lg flex items-center justify-center gap-2">
            <Flame className="w-4 h-4 fill-black" />
            <span>TIGER STREAK ACTIVATED! 1.5X MULTIPLIER BOOST!</span>
            <Flame className="w-4 h-4 fill-black" />
          </div>
        )}

        {/* 3x3 Golden Reels Matrix */}
        <div className="my-6 max-w-md mx-auto relative">
          {/* Temple Roof Header */}
          <div className="bg-gradient-to-r from-[#200508] via-[#541217] to-[#200508] border-t-2 border-x-2 border-[#d4af37] rounded-t-2xl py-2 px-4 text-center shadow-lg flex items-center justify-center gap-2">
            <span className="text-sm">🏮</span>
            <span className="font-cinzel text-xs font-bold text-[#f5d061] tracking-widest uppercase">
              IMPERIAL GOLDEN REELS
            </span>
            <span className="text-sm">🏮</span>
          </div>

          {/* Reels Frame */}
          <div className="bg-[#080a10] border-2 border-[#d4af37] p-3 sm:p-4 rounded-b-2xl shadow-[0_0_40px_rgba(212,175,55,0.25)] relative">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
              {grid.map((row, rowIdx) =>
                row.map((symbolId, colIdx) => {
                  const symbol = SYMBOLS.find((s) => s.id === symbolId) || SYMBOLS[0];
                  const isWinningTile = winningLines.some((lineId) => {
                    const line = PAYLINES.find((l) => l.id === lineId);
                    return line?.coords.some(([r, c]) => r === rowIdx && c === colIdx);
                  });

                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className={`h-24 sm:h-28 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden select-none ${
                        isWinningTile
                          ? 'bg-gradient-to-b from-amber-500/30 to-red-600/30 border-2 border-[#f5d061] shadow-[0_0_25px_rgba(245,208,97,0.6)] scale-105 z-10 animate-bounce'
                          : 'bg-[#121624] border border-[#242c3d]'
                      }`}
                    >
                      <span
                        className={`text-3xl sm:text-4xl transition-transform duration-200 ${
                          isSpinning ? 'blur-xs scale-90' : 'scale-100'
                        }`}
                      >
                        {symbol.icon}
                      </span>
                      <span className={`text-[10px] font-bold mt-1 tracking-tight ${symbol.color}`}>
                        {symbol.id === 'tiger' ? 'WILD' : `${symbol.payout3}X`}
                      </span>

                      {/* Golden Shine for Wilds */}
                      {symbol.id === 'tiger' && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f5d061] animate-ping" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Winning Result Overlay */}
            {lastWin > 0 && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-20 animate-fade-in pointer-events-none">
                <Trophy className="w-12 h-12 text-[#f5d061] animate-bounce mb-2" />
                <span className="font-cinzel text-xl sm:text-2xl font-black text-[#f5d061] tracking-wider">
                  BIG WIN!
                </span>
                <span className="font-mono-numbers text-3xl sm:text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(245,208,97,0.8)]">
                  +₹{lastWin.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-400 mt-1">
                  ({lastMultiplier}x Multiplier Hit)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="max-w-md mx-auto mb-4 bg-red-500/20 border border-red-500/40 text-red-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bottom Betting Controls */}
        <div className="max-w-lg mx-auto space-y-4">
          {/* Bet Preset Buttons */}
          <div className="bg-[#121622] border border-[#242c3d] p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>Wager Points:</span>
              <span className="font-mono-numbers font-bold text-white">₹{wager}</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {[10, 25, 50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  disabled={isSpinning}
                  onClick={() => setWager(amt)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    wager === amt
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black shadow-md'
                      : 'bg-[#182030] text-gray-300 hover:text-white hover:bg-[#202b40]'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
              <button
                disabled={isSpinning}
                onClick={() => setWager(Math.min(userBalance, 1000))}
                className="py-2 rounded-xl text-xs font-bold bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30 cursor-pointer"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Spin CTA Button */}
          <button
            disabled={isSpinning || userBalance < wager}
            onClick={handleSpin}
            className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
              isSpinning
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-black hover:brightness-110 active:scale-98 shadow-[0_0_30px_rgba(245,208,97,0.4)]'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Spinning Reels...' : `SPIN NOW (₹${wager})`}</span>
          </button>
        </div>

        {/* Payout Table Mini Reference */}
        <div className="mt-8 pt-4 border-t border-[#242c3d]">
          <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider text-center">
            PAYTABLE MULTIPLIERS (3 OF A KIND)
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {SYMBOLS.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1.5 bg-[#121622] border border-[#242c3d] px-2.5 py-1.5 rounded-xl"
              >
                <span>{s.icon}</span>
                <span className="font-bold text-white">{s.payout3}X</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Players Scoreboard */}
      <GameScoreboard gameType="FORTUNE_TIGER" gameTitle="Fortune Tiger Slot" />
    </div>
  );
};

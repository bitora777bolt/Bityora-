import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { GameScoreboard } from '../common/GameScoreboard';
import { sounds } from '../../utils/soundEffects';
import {
  Coins,
  RefreshCw,
  Trophy,
  AlertCircle,
  Sparkles,
  Zap,
  Flame,
} from 'lucide-react';

interface CandyDef {
  id: string;
  name: string;
  emoji: string;
  payout8: number; // 8+ match
  color: string;
}

const CANDY_TYPES: CandyDef[] = [
  { id: 'heart', name: 'Heart Candy', emoji: '💖', payout8: 50, color: 'text-pink-400' },
  { id: 'purple', name: 'Purple Jelly', emoji: '🍇', payout8: 25, color: 'text-purple-400' },
  { id: 'green', name: 'Green Gummy', emoji: '🍏', payout8: 15, color: 'text-emerald-400' },
  { id: 'yellow', name: 'Lemon Drop', emoji: '🍋', payout8: 10, color: 'text-yellow-400' },
  { id: 'blue', name: 'Blue Bonbon', emoji: '🫐', payout8: 5, color: 'text-blue-400' },
  { id: 'lollipop', name: 'Rainbow Lollipop', emoji: '🍭', payout8: 100, color: 'text-amber-300' },
];

export const CandyBonanzaGame: React.FC = () => {
  const { currentUser, recordGameRound, soundEnabled } = useGame();

  const [wager, setWager] = useState<number>(50);
  const [isTumbling, setIsTumbling] = useState<boolean>(false);
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: 5 }, () =>
      Array.from({ length: 6 }, () => getRandomCandy())
    )
  );
  const [winningCandies, setWinningCandies] = useState<string[]>([]);
  const [multiplierBomb, setMultiplierBomb] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number>(0);
  const [lastMultiplier, setLastMultiplier] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const tumbleRef = useRef<NodeJS.Timeout | null>(null);
  const userBalance = currentUser?.balance || 0;

  function getRandomCandy(): string {
    const roll = Math.random() * 100;
    if (roll < 5) return 'lollipop'; // rarest
    if (roll < 18) return 'heart';
    if (roll < 35) return 'purple';
    if (roll < 55) return 'green';
    if (roll < 75) return 'yellow';
    return 'blue';
  }

  const handleTumbleSpin = () => {
    if (isTumbling) return;
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

    setIsTumbling(true);
    setWinningCandies([]);
    setMultiplierBomb(null);
    setLastWin(0);
    setLastMultiplier(0);

    if (soundEnabled) sounds.playSpin();

    // Fast scramble tumble animation
    let ticks = 0;
    if (tumbleRef.current) clearInterval(tumbleRef.current);

    tumbleRef.current = setInterval(() => {
      ticks++;
      setGrid(
        Array.from({ length: 5 }, () =>
          Array.from({ length: 6 }, () => getRandomCandy())
        )
      );

      if (ticks >= 14) {
        if (tumbleRef.current) clearInterval(tumbleRef.current);
        finalizeTumble();
      }
    }, 75);
  };

  const finalizeTumble = () => {
    const finalGrid = Array.from({ length: 5 }, () =>
      Array.from({ length: 6 }, () => getRandomCandy())
    );

    // Count occurrences of each candy in the 30 cells
    const counts: Record<string, number> = {};
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        const id = finalGrid[r][c];
        counts[id] = (counts[id] || 0) + 1;
      }
    }

    // High bet luck boost (for bets >= 100)
    if (wager >= 100 && Math.random() < 0.35) {
      // Inject extra heart or lollipop
      finalGrid[0][0] = 'heart';
      finalGrid[1][1] = 'heart';
      finalGrid[2][2] = 'heart';
      counts['heart'] = (counts['heart'] || 0) + 3;
    }

    setGrid(finalGrid);
    setIsTumbling(false);

    // Check matches (8 or more matching candies anywhere)
    const winningTypes: string[] = [];
    let baseMultiplier = 0;

    Object.entries(counts).forEach(([candyId, count]) => {
      if (count >= 8) {
        winningTypes.push(candyId);
        const def = CANDY_TYPES.find((c) => c.id === candyId);
        if (def) {
          const extraBonus = (count - 8) * 2;
          baseMultiplier += def.payout8 + extraBonus;
        }
      }
    });

    setWinningCandies(winningTypes);

    // Random Candy Multiplier Bomb (2x to 50x)
    let bombMult = 1;
    if (Math.random() < 0.25 || winningTypes.length >= 2) {
      const bombs = [2, 3, 5, 10, 15, 25, 50];
      bombMult = bombs[Math.floor(Math.random() * bombs.length)];
      setMultiplierBomb(bombMult);
    }

    if (baseMultiplier > 0) {
      const finalMult = baseMultiplier * bombMult;
      const payout = Math.round(wager * finalMult);
      setLastWin(payout);
      setLastMultiplier(finalMult);

      recordGameRound(
        'CANDY_BONANZA',
        'Candy Bonanza',
        wager,
        finalMult,
        payout,
        `${winningTypes.length} Candy Clusters${bombMult > 1 ? ` with ${bombMult}X Bomb` : ''}`
      );

      if (soundEnabled) {
        if (finalMult >= 25) sounds.playBigWin();
        else sounds.playWin();
      }
    } else {
      recordGameRound('CANDY_BONANZA', 'Candy Bonanza', wager, 0, 0, 'No Cluster Match');
      if (soundEnabled) sounds.playLoss();
    }
  };

  useEffect(() => {
    return () => {
      if (tumbleRef.current) clearInterval(tumbleRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-[#120919] border border-pink-500/40 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Ambient */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-purple-600/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#2e1a38] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg border border-pink-300/40">
              🍭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-wide gold-text-gradient">
                  CANDY BONANZA
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300">
                  100X MULTIPLIER BOMBS
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Play with Credits &bull; 8+ Candy Clusters &bull; Rainbow Bomb Multipliers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#1e1028] border border-[#3b1e4c] px-4 py-2 rounded-2xl">
            <Coins className="w-4 h-4 text-[#f5d061]" />
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Credits Balance</p>
              <p className="text-base font-black text-white font-mono-numbers">
                ₹{userBalance.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Multiplier Bomb Banner */}
        {multiplierBomb && multiplierBomb > 1 && (
          <div className="mt-4 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 text-white font-black text-center py-2 px-4 rounded-2xl text-xs sm:text-sm tracking-widest uppercase animate-bounce shadow-[0_0_25px_rgba(236,72,153,0.5)] flex items-center justify-center gap-2">
            <span>💣</span>
            <span>RAINBOW MULTIPLIER BOMB: {multiplierBomb}X BOOST!</span>
            <span>💣</span>
          </div>
        )}

        {/* 6x5 Candy Grid */}
        <div className="my-6 max-w-xl mx-auto">
          <div className="bg-[#1a0e24] border-2 border-pink-500/40 p-3 sm:p-5 rounded-3xl shadow-[0_0_35px_rgba(236,72,153,0.2)]">
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {grid.map((row, rIdx) =>
                row.map((candyId, cIdx) => {
                  const candy = CANDY_TYPES.find((c) => c.id === candyId) || CANDY_TYPES[0];
                  const isWinner = winningCandies.includes(candyId);

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`aspect-square rounded-2xl flex items-center justify-center text-2xl sm:text-3xl select-none transition-all duration-300 relative ${
                        isWinner
                          ? 'bg-gradient-to-b from-pink-500/40 to-purple-600/40 border-2 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.6)] scale-110 animate-pulse z-10'
                          : 'bg-[#251533] border border-[#3f2154] hover:scale-105'
                      }`}
                    >
                      <span className={isTumbling ? 'blur-xs scale-90' : 'scale-100'}>
                        {candy.emoji}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Win Banner */}
        {lastWin > 0 && (
          <div className="max-w-md mx-auto mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white font-black py-3 px-6 rounded-2xl text-center shadow-xl animate-bounce flex flex-col items-center">
            <div className="flex items-center gap-2 text-lg">
              <Trophy className="w-6 h-6 text-yellow-300" />
              <span>CANDY BLAST WIN!</span>
            </div>
            <span className="text-2xl sm:text-3xl font-mono-numbers mt-0.5">
              +₹{lastWin.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-yellow-200">
              ({lastMultiplier}X Total Multiplier)
            </span>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="max-w-md mx-auto mb-4 bg-red-500/20 border border-red-500/40 text-red-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bet presets & Spin button */}
        <div className="max-w-lg mx-auto space-y-4">
          <div className="bg-[#1e1028] border border-[#3b1e4c] p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Wager Points:</span>
              <span className="font-mono-numbers font-bold text-white">₹{wager}</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {[10, 25, 50, 100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  disabled={isTumbling}
                  onClick={() => setWager(amt)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    wager === amt
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                      : 'bg-[#291738] text-gray-300 hover:text-white'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={isTumbling || userBalance < wager}
            onClick={handleTumbleSpin}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
              isTumbling
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white hover:brightness-110 active:scale-98 shadow-[0_0_30px_rgba(236,72,153,0.4)]'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${isTumbling ? 'animate-spin' : ''}`} />
            <span>{isTumbling ? 'Tumbling...' : `SPIN TUMBLE (₹${wager})`}</span>
          </button>
        </div>

        {/* Candy Paytable */}
        <div className="mt-8 pt-4 border-t border-[#2e1a38]">
          <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider text-center">
            CANDY PAYOUT MULTIPLIERS (8+ MATCHES)
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {CANDY_TYPES.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 bg-[#1e1028] border border-[#3b1e4c] px-3 py-1.5 rounded-xl"
              >
                <span className="text-base">{c.emoji}</span>
                <span className="font-bold text-white">{c.payout8}X</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GameScoreboard gameType="CANDY_BONANZA" gameTitle="Candy Bonanza" />
    </div>
  );
};

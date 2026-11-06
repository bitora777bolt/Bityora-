import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/soundEffects';
import {
  Crown,
  Sparkles,
  Ticket,
  Trophy,
  Zap,
  Clock,
  Coins,
  Flame,
  CheckCircle2,
  Gift,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface RecentWinner {
  name: string;
  avatar: string;
  amount: number;
  game: string;
  timeAgo: string;
}

export const RoyalMegaLottery: React.FC = () => {
  const { currentUser, recordGameRound } = useGame();

  // Live Growing Jackpot Amount
  const [jackpotAmount, setJackpotAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bitora_live_jackpot');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 20000000) return parsed;
      }
    } catch {
      // ignore
    }
    return 28493450;
  });

  // Next Draw Countdown Timer (minutes:seconds)
  const [secondsUntilDraw, setSecondsUntilDraw] = useState<number>(1124); // ~18 mins

  // Interactive Ticket Staging
  const [ticketCost, setTicketCost] = useState<number>(100);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawnBalls, setDrawnBalls] = useState<number[]>([14, 27, 42, 68, 85]);
  const [userNumbers, setUserNumbers] = useState<number[]>([7, 14, 21, 49, 77]);
  const [lastWin, setLastWin] = useState<{ amount: number; matches: number; multiplier: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Select your lucky 5 numbers or use Quick Pick 🎰 to enter the Royal Mega Draw!'
  );

  // Marquee Live Winners
  const [recentWinners] = useState<RecentWinner[]>([
    { name: 'Aarav_VIP', avatar: '👑', amount: 1500000, game: 'Mega Bumper Draw', timeAgo: '2m ago' },
    { name: 'Karan_007', avatar: '🚀', amount: 250000, game: 'Golden Ticket #77', timeAgo: '5m ago' },
    { name: 'Simran_K', avatar: '💎', amount: 85000, game: 'Diamond Scratch', timeAgo: '8m ago' },
    { name: 'Vikram_R', avatar: '🔥', amount: 420000, game: 'Mega Bumper Draw', timeAgo: '12m ago' },
    { name: 'Dev_Mumbai', avatar: '🎰', amount: 100000, game: 'Royal Lucky Ank', timeAgo: '15m ago' },
    { name: 'Pooja_88', avatar: '✨', amount: 65000, game: 'Golden Ticket #21', timeAgo: '19m ago' },
  ]);

  // Live Jackpot Pot Incrementer
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotAmount(prev => {
        const next = prev + Math.floor(Math.random() * 85) + 25;
        try {
          localStorage.setItem('bitora_live_jackpot', String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }, 1400);

    return () => clearInterval(timer);
  }, []);

  // Live Draw Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilDraw(prev => (prev <= 1 ? 1200 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
  };

  // Generate 5 random unique lucky numbers
  const handleQuickPick = () => {
    sounds.playClick();
    const picks = new Set<number>();
    while (picks.size < 5) {
      picks.add(Math.floor(Math.random() * 90) + 1);
    }
    const arr = Array.from(picks).sort((a, b) => a - b);
    setUserNumbers(arr);
    setStatusMessage(`Quick Pick generated: [${arr.join(', ')}]. Ready to play!`);
  };

  // Play / Draw Instant Bumper Ticket with Calibrated Probability (80-85% Loss, 15-20% Win/Doubling)
  const handlePlayLottery = () => {
    if (isDrawing) return;

    if (!currentUser || currentUser.balance < ticketCost) {
      setStatusMessage(`Insufficient Winnings Balance! Available: ₹${currentUser?.balance || 0}.`);
      sounds.mineExplode();
      return;
    }

    setIsDrawing(true);
    setLastWin(null);
    sounds.playSpin();
    setStatusMessage('Rolling the 24K Royal Golden Lottery Cage...');

    // Exact calibrated probability engine (80-85% loss, 15-20% win/doubling)
    const LOSS_PROBABILITY = 0.825; // 82.5% loss rate (strictly in 80% - 85% range)
    const isLossRound = Math.random() < LOSS_PROBABILITY;

    // All available numbers from 1 to 90 excluding user's 5 golden numbers
    const nonMatchingPool: number[] = [];
    for (let i = 1; i <= 90; i++) {
      if (!userNumbers.includes(i)) {
        nonMatchingPool.push(i);
      }
    }

    let finalDrawnBalls: number[] = [];

    if (isLossRound) {
      // 82.5% of rounds: Strict Loss (0 numbers matched)
      const shuffledNonMatches = [...nonMatchingPool].sort(() => Math.random() - 0.5);
      finalDrawnBalls = shuffledNonMatches.slice(0, 5);
    } else {
      // 17.5% of rounds: Win or Double Stake (15% to 20% window)
      const winTierRoll = Math.random();
      let matchCount = 1;

      if (winTierRoll < 0.72) {
        matchCount = 1; // 2.0X Doubling stake
      } else if (winTierRoll < 0.9) {
        matchCount = 2; // 5.0X
      } else if (winTierRoll < 0.97) {
        matchCount = 3; // 20.0X
      } else if (winTierRoll < 0.995) {
        matchCount = 4; // 100.0X
      } else {
        matchCount = 5; // 500.0X Super Royal Jackpot
      }

      // Pick exact `matchCount` numbers from user's 5 lucky numbers
      const shuffledUserNumbers = [...userNumbers].sort(() => Math.random() - 0.5);
      const matchedPicks = shuffledUserNumbers.slice(0, matchCount);

      // Pick the remaining (5 - matchCount) numbers from the non-matching pool
      const shuffledNonMatches = [...nonMatchingPool].sort(() => Math.random() - 0.5);
      const remainingPicks = shuffledNonMatches.slice(0, 5 - matchCount);

      // Combine and shuffle so matching balls appear in unpredictable sequence
      finalDrawnBalls = [...matchedPicks, ...remainingPicks].sort(() => Math.random() - 0.5);
    }

    // Dynamic tumbler: ALL 5 balls constantly display numbers while rolling (NEVER empty circles!)
    let shuffleCount = 0;
    const maxShuffles = 16;
    const shuffleInterval = setInterval(() => {
      shuffleCount++;
      const rollingBalls: number[] = [];
      while (rollingBalls.length < 5) {
        const rand = Math.floor(Math.random() * 90) + 1;
        if (!rollingBalls.includes(rand)) {
          rollingBalls.push(rand);
        }
      }
      setDrawnBalls(rollingBalls);
      sounds.chipClick();

      if (shuffleCount >= maxShuffles) {
        clearInterval(shuffleInterval);
        setDrawnBalls(finalDrawnBalls);
        finalizeDraw(finalDrawnBalls);
      }
    }, 70);
  };

  const finalizeDraw = (drawn: number[]) => {
    setIsDrawing(false);

    // Calculate matches with user numbers
    const matches = userNumbers.filter(num => drawn.includes(num)).length;

    let multiplier = 0;
    let prize = 0;

    if (matches === 5) {
      multiplier = 500;
      prize = ticketCost * multiplier;
    } else if (matches === 4) {
      multiplier = 100;
      prize = ticketCost * multiplier;
    } else if (matches === 3) {
      multiplier = 20;
      prize = ticketCost * multiplier;
    } else if (matches === 2) {
      multiplier = 5;
      prize = ticketCost * multiplier;
    } else if (matches === 1) {
      multiplier = 2; // Doubling stake payout
      prize = ticketCost * multiplier;
    } else {
      multiplier = 0;
      prize = 0;
    }

    if (prize > 0) {
      setLastWin({ amount: prize, matches, multiplier });
      sounds.cashOutWin();
      setStatusMessage(
        matches === 1
          ? `STAKE DOUBLED (2.0X)! Matched 1 Lucky Golden Number: Won ₹${prize.toLocaleString('en-IN')} credited to your balance!`
          : `MEGA BUMPER WIN (${multiplier}X)! Matched ${matches} Golden Numbers: Won ₹${prize.toLocaleString('en-IN')} credited to your balance!`
      );

      recordGameRound(
        'LOTTERY_MEGA',
        'Royal Mega Lottery',
        ticketCost,
        multiplier,
        prize,
        `Matched ${matches} numbers in Bumper Draw: [${drawn.join(', ')}]`
      );
    } else {
      setLastWin({ amount: 0, matches: 0, multiplier: 0 });
      sounds.playLoss();
      setStatusMessage(
        `Draw complete: [${drawn.join(', ')}]. 0 matches on your 5 Golden Numbers this round. Try another ticket!`
      );

      recordGameRound(
        'LOTTERY_MEGA',
        'Royal Mega Lottery',
        ticketCost,
        0,
        0,
        `No matches in Bumper Draw: [${drawn.join(', ')}]`
      );
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#141206] via-[#100d05] to-[#0a0803] border-2 border-[#d4af37]/50 p-4 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.25)] relative overflow-hidden space-y-6">
      {/* Opulent Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-red-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* 1. Header with Golden Trophy & Live Ticking Jackpot Pot */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-[#d4af37]/30 pb-5">
        <div className="flex items-center gap-4 text-center lg:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#fef08a] via-[#f59e0b] to-[#78350f] p-0.5 shadow-2xl shrink-0">
            <div className="w-full h-full bg-[#181105] rounded-2xl flex items-center justify-center border border-[#fef08a]/60">
              <Trophy className="w-10 h-10 text-[#facc15] animate-bounce" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center lg:justify-start flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#facc15] px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                DAILY ROYAL BUMPER LOTTERY
              </span>
              <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40">
                100% DEMO WINNINGS
              </span>
            </div>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-white mt-1">
              ₹5 CRORE MEGA JACKPOT POOL
            </h2>
            <p className="text-xs text-gray-400">
              Live Provably Fair Draw &bull; Guaranteed Multiplier Payouts from 2X to 500X
            </p>
          </div>
        </div>

        {/* Live Rolling Jackpot Counter Display */}
        <div className="bg-gradient-to-r from-[#1c1505] via-[#241b07] to-[#1c1505] border-2 border-[#facc15]/60 rounded-2xl p-4 sm:px-6 shadow-[0_0_30px_rgba(234,179,8,0.35)] text-center">
          <p className="text-[10px] text-amber-300 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            CURRENT ACCUMULATED JACKPOT POT
          </p>
          <div className="font-mono-numbers font-black text-2xl sm:text-4xl gold-text-gradient drop-shadow-[0_2px_15px_rgba(245,158,11,0.5)] mt-1">
            ₹{jackpotAmount.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 mt-1 font-mono-numbers">
            <Clock className="w-3 h-3 text-[#facc15]" />
            <span>Next Bumper Draw In:</span>
            <span className="text-white font-bold">{formatCountdown(secondsUntilDraw)}</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Lucky Ticket Entry Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Ticket Selector & Number Board (7 cols) */}
        <div className="lg:col-span-7 bg-[#140e04] border border-[#d4af37]/35 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Ticket className="w-4 h-4 text-[#facc15]" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                Your 5 Lucky Golden Numbers
              </span>
            </div>
            <button
              onClick={handleQuickPick}
              disabled={isDrawing}
              className="text-[11px] font-bold text-black bg-gradient-to-r from-[#fde047] to-[#ca8a04] hover:brightness-110 px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow"
            >
              <Sparkles className="w-3 h-3" />
              <span>Quick Pick 🎰</span>
            </button>
          </div>

          {/* 5 User Lucky Ball Badges */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
            {userNumbers.map((num, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isDrawing}
                onClick={() => {
                  if (isDrawing) return;
                  sounds.playClick();
                  // Cycle number by +1 (1 to 90) avoiding duplicates
                  setUserNumbers(prev => {
                    const nextArr = [...prev];
                    let candidate = (nextArr[idx] % 90) + 1;
                    while (nextArr.includes(candidate)) {
                      candidate = (candidate % 90) + 1;
                    }
                    nextArr[idx] = candidate;
                    return nextArr;
                  });
                }}
                title="Click to cycle number or use Quick Pick"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#854d0e] p-0.5 shadow-lg transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-full h-full bg-[#181105] rounded-2xl flex flex-col items-center justify-center border border-[#fde047]/60">
                  <span className="text-[9px] text-amber-300 font-bold">#0{idx + 1}</span>
                  <span className="font-mono-numbers text-base sm:text-lg font-black text-white">
                    {num}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Odds & Multipliers Transparent Breakdown */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px] text-center font-mono-numbers">
            <div className="p-1.5 rounded-lg bg-[#0e0a03] border border-[#2d2008]">
              <span className="text-gray-400 block text-[9px]">0 Matches</span>
              <span className="font-bold text-red-400">0.0X (Loss)</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#0e0a03] border border-amber-500/30">
              <span className="text-amber-300 block text-[9px]">1 Match</span>
              <span className="font-bold text-emerald-400">2.0X (Double)</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#0e0a03] border border-amber-500/30">
              <span className="text-amber-300 block text-[9px]">2 Matches</span>
              <span className="font-bold text-emerald-400">5.0X</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#0e0a03] border border-amber-500/30">
              <span className="text-amber-300 block text-[9px]">3 Matches</span>
              <span className="font-bold text-emerald-400">20.0X</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#0e0a03] border border-amber-500/30">
              <span className="text-amber-300 block text-[9px]">4 Matches</span>
              <span className="font-bold text-emerald-400">100.0X</span>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/50">
              <span className="text-yellow-300 block text-[9px]">5 Matches</span>
              <span className="font-bold text-yellow-300">500X (Jackpot)</span>
            </div>
          </div>

          {/* Wager Ticket Price Selection */}
          <div className="flex items-center justify-between border-t border-[#2a1d07] pt-3 text-xs">
            <span className="text-gray-400">Entry Ticket Price:</span>
            <div className="flex items-center gap-1.5">
              {[50, 100, 250, 500].map(amt => (
                <button
                  key={amt}
                  disabled={isDrawing}
                  onClick={() => setTicketCost(amt)}
                  className={`px-3 py-1 rounded-lg font-mono-numbers font-bold cursor-pointer transition-all ${
                    ticketCost === amt
                      ? 'bg-[#d4af37] text-black shadow'
                      : 'bg-[#1e1507] text-gray-300 border border-[#3b2a0e] hover:text-white'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Draw Barrel & Action Button (5 cols) */}
        <div className="lg:col-span-5 bg-[#140e04] border border-[#d4af37]/35 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                Drawn Winning Numbers
              </span>
              <span className="text-[10px] font-mono-numbers font-bold text-amber-300">
                {isDrawing ? 'DRAWING LIVE...' : 'OFFICIAL RESULTS'}
              </span>
            </div>

            {/* 5 Drawn Winning Balls Display - All 5 numbers fully visible without empty circles */}
            <div className="flex items-center justify-center gap-2 my-2 min-h-[52px]">
              {drawnBalls.map((b, idx) => {
                const isMatch = !isDrawing && userNumbers.includes(b);
                return (
                  <div
                    key={idx}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex flex-col items-center justify-center font-mono-numbers font-black shadow-xl transition-all ${
                      isDrawing
                        ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 text-black border border-yellow-200 animate-pulse'
                        : isMatch
                        ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 text-black border-2 border-emerald-200 ring-2 ring-emerald-400 scale-105'
                        : 'bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#854d0e] text-black border border-[#fde047]/60'
                    }`}
                  >
                    <span className="text-sm sm:text-base leading-none">{b}</span>
                    <span className="text-[8px] font-bold uppercase tracking-tighter opacity-80 mt-0.5">
                      {isMatch ? 'MATCH' : `#0${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handlePlayLottery}
            disabled={isDrawing || !currentUser || currentUser.balance < ticketCost}
            className="w-full py-4 rounded-2xl font-black text-black bg-gradient-to-r from-[#fde047] via-[#f59e0b] to-[#d97706] hover:brightness-110 shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all uppercase tracking-wider text-sm sm:text-base flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 fill-current" />
              <span>{isDrawing ? 'ROLLING DRAW DRUM...' : `BUY LUCKY TICKET (₹${ticketCost})`}</span>
            </div>
            <span className="text-[11px] font-sans font-bold text-black/80 mt-0.5">
              Win up to ₹{(ticketCost * 500).toLocaleString('en-IN')} Instantly
            </span>
          </button>
        </div>
      </div>

      {/* 3. Win Banner & Status Notification */}
      {lastWin && lastWin.amount > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-3.5 rounded-2xl text-center shadow-xl flex items-center justify-center gap-3 animate-bounce">
          <CheckCircle2 className="w-6 h-6 text-yellow-300 shrink-0" />
          <span className="font-bold text-sm sm:text-base font-cinzel">
            {lastWin.multiplier === 2 ? 'STAKE DOUBLED' : 'BUMPER WIN'}: +₹{lastWin.amount.toLocaleString('en-IN')}! Matched {lastWin.matches} golden numbers at {lastWin.multiplier}X!
          </span>
        </div>
      )}

      {lastWin && lastWin.amount === 0 && (
        <div className="bg-gradient-to-r from-red-950/80 via-rose-950/80 to-red-950/80 border border-red-500/40 text-red-200 p-3 rounded-2xl text-center shadow-xl flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="font-bold text-xs sm:text-sm">
            ROUND MISSED (0 Matches &bull; -₹{ticketCost}): No matching numbers this draw. Try another ticket!
          </span>
        </div>
      )}

      {/* Status message */}
      <p className="text-xs text-amber-200/80 text-center font-medium">
        {statusMessage}
      </p>

      {/* 4. Live Recent Jackpot Winners Horizontal Marquee Ticker */}
      <div className="bg-[#0b0803] border border-[#d4af37]/25 rounded-xl p-2.5 overflow-hidden">
        <div className="flex items-center gap-2 mb-1.5 px-2 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>Live Recent Mega Winners:</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto py-1 px-2 no-scrollbar">
          {recentWinners.map((win, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-[#171105] border border-[#d4af37]/35 px-3 py-1.5 rounded-xl shrink-0 text-xs shadow-md"
            >
              <span className="text-sm">{win.avatar}</span>
              <div>
                <p className="font-bold text-white leading-none">
                  {win.name}{' '}
                  <span className="text-emerald-400 font-mono-numbers font-black">
                    +₹{win.amount.toLocaleString('en-IN')}
                  </span>
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  {win.game} &bull; {win.timeAgo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

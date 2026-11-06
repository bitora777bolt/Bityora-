import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { GameScoreboard } from '../common/GameScoreboard';
import { sounds } from '../../utils/soundEffects';
import {
  Coins,
  RefreshCw,
  Trophy,
  AlertCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

type BetType = 'straight' | 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3';

interface PlacedBet {
  type: BetType;
  value?: number; // for straight bets
  amount: number;
}

export const RouletteGame: React.FC = () => {
  const { currentUser, recordGameRound, soundEnabled, toggleSound } = useGame();

  const [selectedChip, setSelectedChip] = useState<number>(20);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [history, setHistory] = useState<number[]>([14, 32, 0, 7, 21]);

  const userBalance = currentUser?.balance || 0;
  const totalBetAmount = bets.reduce((acc, b) => acc + b.amount, 0);

  const getNumberColor = (num: number): 'green' | 'red' | 'black' => {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  const handlePlaceBet = (type: BetType, value?: number) => {
    if (isSpinning) return;
    setErrorMsg('');

    if (totalBetAmount + selectedChip > userBalance) {
      setErrorMsg(`Insufficient credits! Total balance is ₹${userBalance}`);
      if (soundEnabled) sounds.playBomb();
      return;
    }

    if (soundEnabled) sounds.playClick();

    setBets((prev) => {
      const existingIdx = prev.findIndex(
        (b) => b.type === type && (type !== 'straight' || b.value === value)
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          amount: updated[existingIdx].amount + selectedChip,
        };
        return updated;
      } else {
        return [...prev, { type, value, amount: selectedChip }];
      }
    });
  };

  const clearBets = () => {
    if (isSpinning) return;
    setBets([]);
    setErrorMsg('');
  };

  const spinWheel = () => {
    if (isSpinning) return;
    setErrorMsg('');

    if (bets.length === 0 || totalBetAmount <= 0) {
      setErrorMsg('Please place chips on the table first!');
      return;
    }

    if (totalBetAmount > userBalance) {
      setErrorMsg(`Insufficient credits! Total balance is ₹${userBalance}`);
      return;
    }

    setIsSpinning(true);
    setWinningNumber(null);
    setLastWin(0);

    if (soundEnabled) sounds.playSpin();

    // Pick random winning number 0-36
    const chosenNumber = Math.floor(Math.random() * 37);
    const chosenIndex = WHEEL_NUMBERS.indexOf(chosenNumber);

    // Calculate rotation angle
    const degreesPerPocket = 360 / 37;
    const targetAngle = 360 * 5 + (37 - chosenIndex) * degreesPerPocket;

    setWheelRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setWinningNumber(chosenNumber);
      setIsSpinning(false);
      setHistory((prev) => [chosenNumber, ...prev.slice(0, 7)]);

      // Calculate payouts
      let totalPayout = 0;
      const isRed = RED_NUMBERS.includes(chosenNumber);
      const isBlack = chosenNumber !== 0 && !isRed;
      const isEven = chosenNumber !== 0 && chosenNumber % 2 === 0;
      const isOdd = chosenNumber !== 0 && chosenNumber % 2 !== 0;
      const isLow = chosenNumber >= 1 && chosenNumber <= 18;
      const isHigh = chosenNumber >= 19 && chosenNumber <= 36;
      const isDozen1 = chosenNumber >= 1 && chosenNumber <= 12;
      const isDozen2 = chosenNumber >= 13 && chosenNumber <= 24;
      const isDozen3 = chosenNumber >= 25 && chosenNumber <= 36;

      bets.forEach((bet) => {
        if (bet.type === 'straight' && bet.value === chosenNumber) {
          totalPayout += bet.amount * 36;
        } else if (bet.type === 'red' && isRed) {
          totalPayout += bet.amount * 2;
        } else if (bet.type === 'black' && isBlack) {
          totalPayout += bet.amount * 2;
        } else if (bet.type === 'even' && isEven) {
          totalPayout += bet.amount * 2;
        } else if (bet.type === 'odd' && isOdd) {
          totalPayout += bet.amount * 2;
        } else if (bet.type === 'low' && isLow) {
          totalPayout += bet.amount * 2;
        } else if (bet.type === 'high' && isHigh) {
          totalPayout += bet.amount * 2;
        } else if (bet.type === 'dozen1' && isDozen1) {
          totalPayout += bet.amount * 3;
        } else if (bet.type === 'dozen2' && isDozen2) {
          totalPayout += bet.amount * 3;
        } else if (bet.type === 'dozen3' && isDozen3) {
          totalPayout += bet.amount * 3;
        }
      });

      const effectiveMultiplier = totalBetAmount > 0 ? Number((totalPayout / totalBetAmount).toFixed(2)) : 0;
      setLastWin(totalPayout);

      if (totalPayout > 0) {
        recordGameRound(
          'EUROPEAN_ROULETTE',
          'European Roulette',
          totalBetAmount,
          effectiveMultiplier,
          totalPayout,
          `Ball Landed on ${chosenNumber} (${getNumberColor(chosenNumber).toUpperCase()})`
        );
        if (soundEnabled) {
          if (effectiveMultiplier >= 10) sounds.playBigWin();
          else sounds.playWin();
        }
      } else {
        recordGameRound(
          'EUROPEAN_ROULETTE',
          'European Roulette',
          totalBetAmount,
          0,
          0,
          `Ball Landed on ${chosenNumber} (${getNumberColor(chosenNumber).toUpperCase()})`
        );
        if (soundEnabled) sounds.playLoss();
      }
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0b0e17] border border-[#d4af37]/40 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Ambient */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#242c3d]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8c7322] via-[#d4af37] to-[#59440e] flex items-center justify-center text-black font-black text-2xl shadow-lg border border-[#fff2a3]/40">
              🎡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-wide gold-text-gradient">
                  EUROPEAN ROULETTE
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  36X STRAIGHT
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Credits &bull; Single Zero (0) &bull; 37 Pockets
              </p>
            </div>
          </div>

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

        {/* Wheel Graphic & Result Display */}
        <div className="my-6 flex flex-col md:flex-row items-center justify-around gap-6 bg-[#07090f] border border-[#242c3d] p-4 sm:p-6 rounded-3xl">
          {/* Animated Wheel */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
            {/* Pointer Pin at top */}
            <div className="absolute top-0 z-20 -translate-y-2 flex flex-col items-center">
              <div className="w-4 h-4 bg-amber-400 rotate-45 shadow-lg border border-white" />
            </div>

            {/* Rotating Wheel Container */}
            <div
              className="w-full h-full rounded-full border-8 border-[#3d2f10] shadow-[0_0_35px_rgba(212,175,55,0.3)] relative transition-all duration-4000 ease-out"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                background: 'radial-gradient(circle, #1a2233 40%, #0d121c 90%)',
              }}
            >
              {/* Wheel Rim and Pockets */}
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="92" fill="#151b26" stroke="#d4af37" strokeWidth="3" />
                {WHEEL_NUMBERS.map((num, idx) => {
                  const angle = (idx * 360) / 37;
                  const color = num === 0 ? '#10b981' : RED_NUMBERS.includes(num) ? '#ef4444' : '#1e293b';
                  return (
                    <g key={num} transform={`rotate(${angle} 100 100)`}>
                      <line x1="100" y1="8" x2="100" y2="28" stroke="#d4af37" strokeWidth="1" />
                      <rect x="94" y="10" width="12" height="16" fill={color} rx="2" />
                      <text
                        x="100"
                        y="22"
                        fill="#ffffff"
                        fontSize="7"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {num}
                      </text>
                    </g>
                  );
                })}
                {/* Center Hub */}
                <circle cx="100" cy="100" r="32" fill="#2d220b" stroke="#f5d061" strokeWidth="3" />
                <circle cx="100" cy="100" r="14" fill="#d4af37" />
              </svg>
            </div>
          </div>

          {/* Outcome & Stats Panel */}
          <div className="space-y-4 text-center md:text-left">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-mono-numbers">
                WINNING NUMBER
              </p>
              {winningNumber !== null ? (
                <div className="flex items-center gap-3 mt-1">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl ${
                      getNumberColor(winningNumber) === 'green'
                        ? 'bg-emerald-600'
                        : getNumberColor(winningNumber) === 'red'
                        ? 'bg-red-600'
                        : 'bg-gray-900 border border-gray-700'
                    }`}
                  >
                    {winningNumber}
                  </div>
                  <div>
                    <p className="font-cinzel text-lg font-black text-white">
                      {winningNumber === 0
                        ? 'ZERO (0)'
                        : `${winningNumber} - ${getNumberColor(winningNumber).toUpperCase()}`}
                    </p>
                    {lastWin > 0 ? (
                      <p className="text-sm font-bold text-emerald-400">
                        Won: +₹{lastWin.toLocaleString('en-IN')}!
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">No Win</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-lg font-bold text-gray-500 mt-2">
                  {isSpinning ? 'Ball spinning...' : 'Place chips and spin the wheel'}
                </p>
              )}
            </div>

            {/* Recent History Numbers */}
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">Recent Numbers:</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {history.map((n, i) => (
                  <span
                    key={i}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center text-white ${
                      getNumberColor(n) === 'green'
                        ? 'bg-emerald-600'
                        : getNumberColor(n) === 'red'
                        ? 'bg-red-600'
                        : 'bg-gray-800 border border-gray-700'
                    }`}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Betting Board Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Roulette Layout (Tap to place chips):</span>
            <span className="font-mono-numbers">
              Total Bet: <strong className="text-[#f5d061]">₹{totalBetAmount}</strong>
            </span>
          </div>

          {/* Zero + Numbers Grid (1 to 36) */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[620px] bg-[#080b12] border border-[#242c3d] p-3 rounded-2xl select-none">
              {/* Zero */}
              <div className="flex gap-1.5 mb-1.5">
                <button
                  disabled={isSpinning}
                  onClick={() => handlePlaceBet('straight', 0)}
                  className="w-16 h-10 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center border border-emerald-400/40 relative cursor-pointer"
                >
                  <span>0</span>
                  {bets.find((b) => b.type === 'straight' && b.value === 0) && (
                    <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1 rounded-full shadow">
                      ₹{bets.find((b) => b.type === 'straight' && b.value === 0)?.amount}
                    </span>
                  )}
                </button>
              </div>

              {/* 3 Rows of 12 Numbers */}
              <div className="grid grid-rows-3 grid-flow-col gap-1.5">
                {[
                  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
                  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
                  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
                ].map((row, rIdx) => (
                  <React.Fragment key={rIdx}>
                    {row.map((num) => {
                      const isRed = RED_NUMBERS.includes(num);
                      const bet = bets.find((b) => b.type === 'straight' && b.value === num);
                      return (
                        <button
                          key={num}
                          disabled={isSpinning}
                          onClick={() => handlePlaceBet('straight', num)}
                          className={`w-12 h-10 rounded-xl font-bold text-sm flex items-center justify-center text-white relative transition-all cursor-pointer ${
                            isRed
                              ? 'bg-red-600/80 hover:bg-red-500 border border-red-500/40'
                              : 'bg-gray-800 hover:bg-gray-700 border border-gray-600/40'
                          }`}
                        >
                          <span>{num}</span>
                          {bet && (
                            <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1 rounded-full shadow">
                              ₹{bet.amount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Dozen Bets */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {[
                  { id: 'dozen1', label: '1st 12 (1 to 12) • 3X' },
                  { id: 'dozen2', label: '2nd 12 (13 to 24) • 3X' },
                  { id: 'dozen3', label: '3rd 12 (25 to 36) • 3X' },
                ].map((d) => {
                  const bet = bets.find((b) => b.type === d.id);
                  return (
                    <button
                      key={d.id}
                      disabled={isSpinning}
                      onClick={() => handlePlaceBet(d.id as BetType)}
                      className="py-2 rounded-xl text-xs font-bold bg-[#141b2a] hover:bg-[#1e283d] text-gray-200 border border-[#242c3d] relative cursor-pointer"
                    >
                      {d.label}
                      {bet && (
                        <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1 rounded-full">
                          ₹{bet.amount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Outside Bets (Red/Black, Even/Odd, Low/High) */}
              <div className="grid grid-cols-6 gap-1.5 mt-1.5">
                {[
                  { id: 'low', label: '1 - 18', mult: '2X' },
                  { id: 'even', label: 'EVEN', mult: '2X' },
                  { id: 'red', label: 'RED 🔴', mult: '2X', bg: 'bg-red-700 hover:bg-red-600 text-white' },
                  { id: 'black', label: 'BLACK ⚫', mult: '2X', bg: 'bg-gray-900 hover:bg-gray-800 text-white' },
                  { id: 'odd', label: 'ODD', mult: '2X' },
                  { id: 'high', label: '19 - 36', mult: '2X' },
                ].map((btn) => {
                  const bet = bets.find((b) => b.type === btn.id);
                  return (
                    <button
                      key={btn.id}
                      disabled={isSpinning}
                      onClick={() => handlePlaceBet(btn.id as BetType)}
                      className={`py-2 rounded-xl text-xs font-bold border border-[#242c3d] relative cursor-pointer ${
                        btn.bg || 'bg-[#141b2a] hover:bg-[#1e283d] text-gray-200'
                      }`}
                    >
                      <span>{btn.label}</span>
                      {bet && (
                        <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1 rounded-full">
                          ₹{bet.amount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="max-w-md mx-auto my-3 bg-red-500/20 border border-red-500/40 text-red-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Chip Presets & Spin Controls */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121622] p-4 rounded-2xl border border-[#242c3d]">
          {/* Chip Value Selector */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-gray-400 font-bold mr-1">Chips:</span>
            {[10, 20, 50, 100, 200, 500].map((chip) => (
              <button
                key={chip}
                disabled={isSpinning}
                onClick={() => setSelectedChip(chip)}
                className={`w-10 h-10 rounded-full font-black text-xs border-2 shadow-md flex items-center justify-center transition-all cursor-pointer ${
                  selectedChip === chip
                    ? 'scale-110 border-amber-300 bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black ring-2 ring-amber-400/50'
                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-400'
                }`}
              >
                ₹{chip}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              disabled={isSpinning || bets.length === 0}
              onClick={clearBets}
              className="px-4 py-3 rounded-xl text-xs font-bold bg-[#1a2130] hover:bg-[#253046] text-gray-300 border border-[#242c3d] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Bets</span>
            </button>

            <button
              disabled={isSpinning || totalBetAmount <= 0}
              onClick={spinWheel}
              className={`flex-1 sm:flex-none px-8 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSpinning || totalBetAmount <= 0
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-black hover:brightness-110 shadow-[0_0_25px_rgba(245,208,97,0.4)]'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Spinning...' : `SPIN WHEEL (₹${totalBetAmount})`}</span>
            </button>
          </div>
        </div>
      </div>

      <GameScoreboard gameType="EUROPEAN_ROULETTE" gameTitle="European Roulette" />
    </div>
  );
};

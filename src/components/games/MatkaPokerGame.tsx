import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { GameScoreboard } from '../common/GameScoreboard';
import { sounds } from '../../utils/soundEffects';
import {
  Coins,
  RefreshCw,
  Trophy,
  AlertCircle,
  Sparkles,
  Flame,
  RotateCcw,
} from 'lucide-react';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: number; // 1 to 13 (1=Ace, 11=J, 12=Q, 13=K)
  label: string;
  isRed: boolean;
}

type BetCategory = 'ank' | 'range' | 'poker';

interface PlacedMatkaBet {
  category: BetCategory;
  target: string | number; // e.g. 7 (ank), 'LOW'/'HIGH' (range), 'TRIO'/'PAIR' (poker)
  amount: number;
}

export const MatkaPokerGame: React.FC = () => {
  const { currentUser, recordGameRound, soundEnabled } = useGame();

  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [bets, setBets] = useState<PlacedMatkaBet[]>([]);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [cards, setCards] = useState<Card[]>([
    { suit: '♠', value: 1, label: 'A', isRed: false },
    { suit: '♥', value: 13, label: 'K', isRed: true },
    { suit: '♦', value: 12, label: 'Q', isRed: true },
  ]);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [singleAnk, setSingleAnk] = useState<number | null>(null);
  const [pokerHandTitle, setPokerHandTitle] = useState<string>('');
  const [lastWin, setLastWin] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [history, setHistory] = useState<number[]>([7, 3, 9, 0, 5]);

  const userBalance = currentUser?.balance || 0;
  const totalBet = bets.reduce((acc, b) => acc + b.amount, 0);

  const getCardLabel = (val: number) => {
    if (val === 1) return 'A';
    if (val === 11) return 'J';
    if (val === 12) return 'Q';
    if (val === 13) return 'K';
    return String(val);
  };

  const drawRandomCard = (): Card => {
    const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = Math.floor(Math.random() * 13) + 1;
    return {
      suit,
      value,
      label: getCardLabel(value),
      isRed: suit === '♥' || suit === '♦',
    };
  };

  const handleAddBet = (category: BetCategory, target: string | number) => {
    if (isDealing) return;
    setErrorMsg('');

    if (totalBet + selectedChip > userBalance) {
      setErrorMsg(`Insufficient credits! Total balance is ₹${userBalance}`);
      if (soundEnabled) sounds.playBomb();
      return;
    }

    if (soundEnabled) sounds.playClick();

    setBets((prev) => {
      const idx = prev.findIndex((b) => b.category === category && b.target === target);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], amount: copy[idx].amount + selectedChip };
        return copy;
      }
      return [...prev, { category, target, amount: selectedChip }];
    });
  };

  const clearAllBets = () => {
    if (isDealing) return;
    setBets([]);
    setErrorMsg('');
  };

  const handleDeal = () => {
    if (isDealing) return;
    setErrorMsg('');

    if (bets.length === 0 || totalBet <= 0) {
      setErrorMsg('Please place bets on Ank or Poker hands first!');
      return;
    }

    if (totalBet > userBalance) {
      setErrorMsg(`Insufficient credits! Your available balance is ₹${userBalance}.`);
      return;
    }

    setIsDealing(true);
    setRevealed(false);
    setLastWin(0);

    if (soundEnabled) sounds.playSpin();

    setTimeout(() => {
      // Deal 3 unique cards
      const c1 = drawRandomCard();
      const c2 = drawRandomCard();
      const c3 = drawRandomCard();
      const newCards = [c1, c2, c3];
      setCards(newCards);

      // Compute Matka Single Ank: sum of 3 card values % 10
      const totalSum = c1.value + c2.value + c3.value;
      const ank = totalSum % 10;
      setSingleAnk(ank);
      setHistory((prev) => [ank, ...prev.slice(0, 7)]);

      // Evaluate 3-Card Poker hand
      const vals = [c1.value, c2.value, c3.value].sort((a, b) => a - b);
      const isFlush = c1.suit === c2.suit && c2.suit === c3.suit;
      const isStraight =
        (vals[0] + 1 === vals[1] && vals[1] + 1 === vals[2]) ||
        (vals[0] === 1 && vals[1] === 12 && vals[2] === 13); // A-Q-K
      const isTrio = c1.value === c2.value && c2.value === c3.value;
      const isPair = c1.value === c2.value || c2.value === c3.value || c1.value === c3.value;

      let handName = 'High Card';
      if (isTrio) handName = 'Trio (Trail)';
      else if (isFlush && isStraight) handName = 'Pure Sequence';
      else if (isStraight) handName = 'Sequence';
      else if (isFlush) handName = 'Color (Flush)';
      else if (isPair) handName = 'Pair';

      setPokerHandTitle(handName);
      setRevealed(true);
      setIsDealing(false);

      // Evaluate Payouts
      let payout = 0;
      const isLow = ank >= 0 && ank <= 4;
      const isHigh = ank >= 5 && ank <= 9;

      bets.forEach((b) => {
        if (b.category === 'ank' && b.target === ank) {
          payout += b.amount * 9.0; // 9x single ank
        } else if (b.category === 'range' && b.target === 'LOW' && isLow) {
          payout += b.amount * 2.0;
        } else if (b.category === 'range' && b.target === 'HIGH' && isHigh) {
          payout += b.amount * 2.0;
        } else if (b.category === 'poker') {
          if (b.target === 'TRIO' && isTrio) payout += b.amount * 50.0;
          else if (b.target === 'SEQUENCE' && isStraight) payout += b.amount * 10.0;
          else if (b.target === 'COLOR' && isFlush) payout += b.amount * 5.0;
          else if (b.target === 'PAIR' && (isPair || isTrio)) payout += b.amount * 2.5;
        }
      });

      setLastWin(payout);
      const mult = totalBet > 0 ? Number((payout / totalBet).toFixed(2)) : 0;

      if (payout > 0) {
        recordGameRound(
          'MATKA_POKER',
          'Matka Poker',
          totalBet,
          mult,
          payout,
          `Ank: ${ank} (${handName})`
        );
        if (soundEnabled) {
          if (mult >= 9) sounds.playBigWin();
          else sounds.playWin();
        }
      } else {
        recordGameRound('MATKA_POKER', 'Matka Poker', totalBet, 0, 0, `Ank: ${ank} (${handName})`);
        if (soundEnabled) sounds.playLoss();
      }
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0b0e17] border border-amber-500/40 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Ambient */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#242c3d]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 via-[#d4af37] to-yellow-600 flex items-center justify-center text-2xl shadow-lg border border-[#f5d061]/50">
              🏺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-wide gold-text-gradient">
                  MATKA POKER
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[#f5d061]">
                  9X ANK • 50X TRIO
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Credits &bull; Single Ank 0 to 9 &bull; 3-Card Poker Hands
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

        {/* Matka Pot & 3 Deal Cards Display */}
        <div className="my-6 bg-[#07090f] border border-[#242c3d] p-4 sm:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-around gap-6">
          {/* Matka Pot & Lucky Ank Result */}
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              {/* Earthen Matka Pot SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <defs>
                  <radialGradient id="matkaClay" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="70%" stopColor="#78350f" />
                    <stop offset="100%" stopColor="#451a03" />
                  </radialGradient>
                </defs>
                <ellipse cx="50" cy="18" rx="20" ry="6" fill="#f59e0b" stroke="#fcd34d" strokeWidth="2" />
                <path d="M 30 18 Q 20 45 22 70 Q 25 90 50 90 Q 75 90 78 70 Q 80 45 70 18 Z" fill="url(#matkaClay)" stroke="#d4af37" strokeWidth="2" />
                {/* Decorative golden bands */}
                <path d="M 24 55 Q 50 65 76 55" stroke="#fcd34d" strokeWidth="3" fill="none" />
                <path d="M 28 40 Q 50 48 72 40" stroke="#f59e0b" strokeWidth="2" fill="none" />
              </svg>

              {/* Single Ank Center Emblem */}
              <div className="absolute inset-0 flex items-center justify-center pt-3">
                <span className="font-mono-numbers text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  {singleAnk !== null ? singleAnk : '?'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Open Single Ank
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#f5d061] font-cinzel">
                {singleAnk !== null ? `ANK ${singleAnk}` : 'WAITING...'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Hand: <strong className="text-white">{pokerHandTitle || 'Deal Cards'}</strong>
              </p>
            </div>
          </div>

          {/* 3 Real Playing Cards */}
          <div className="flex items-center gap-2 sm:gap-3">
            {cards.map((c, i) => (
              <div
                key={i}
                className={`w-16 h-24 sm:w-20 sm:h-30 rounded-2xl border-2 flex flex-col justify-between p-2 shadow-xl select-none transition-all duration-300 ${
                  isDealing
                    ? 'scale-95 bg-gray-800 border-gray-600 animate-pulse'
                    : 'bg-white border-amber-300 scale-100 hover:-translate-y-1'
                }`}
              >
                <div className={`text-xs sm:text-sm font-black leading-none ${c.isRed ? 'text-red-600' : 'text-black'}`}>
                  {c.label}
                  <div className="text-[10px]">{c.suit}</div>
                </div>

                <div className={`text-2xl sm:text-3xl text-center font-bold ${c.isRed ? 'text-red-600' : 'text-black'}`}>
                  {c.suit}
                </div>

                <div className={`text-xs sm:text-sm font-black leading-none text-right rotate-180 ${c.isRed ? 'text-red-600' : 'text-black'}`}>
                  {c.label}
                </div>
              </div>
            ))}
          </div>

          {/* History Ank */}
          <div className="text-center md:text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Recent Ank History:</p>
            <div className="flex items-center gap-1">
              {history.map((h, i) => (
                <span
                  key={i}
                  className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center font-mono-numbers"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Win Banner */}
        {lastWin > 0 && (
          <div className="mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black py-2 px-4 rounded-2xl text-center flex items-center justify-center gap-2 shadow-lg animate-bounce">
            <Trophy className="w-5 h-5 text-amber-300" />
            <span>Matka Poker Win: +₹{lastWin.toLocaleString('en-IN')}!</span>
          </div>
        )}

        {/* Betting Board */}
        <div className="space-y-4">
          {/* Section 1: Single Ank (0-9) - 9X Payout */}
          <div className="bg-[#121622] border border-[#242c3d] p-3 sm:p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#f5d061] uppercase tracking-wide">
                Single Ank Bets (0 to 9) &bull; 9.0X Payout
              </span>
              <span className="text-gray-400">Tap adds ₹{selectedChip} per click</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((ankVal) => {
                const bet = bets.find((b) => b.category === 'ank' && b.target === ankVal);
                return (
                  <button
                    key={ankVal}
                    disabled={isDealing}
                    onClick={() => handleAddBet('ank', ankVal)}
                    className="h-12 rounded-xl bg-[#171e2c] hover:bg-[#20293d] border border-amber-500/30 font-mono-numbers text-lg font-black text-white flex flex-col items-center justify-center relative cursor-pointer"
                  >
                    <span>{ankVal}</span>
                    {bet && (
                      <span className="absolute -top-1 -right-1 bg-[#d4af37] text-black text-[9px] font-black px-1 rounded-full shadow">
                        ₹{bet.amount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Range & Poker Hands */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Range: Low (0-4) / High (5-9) */}
            <div className="bg-[#121622] border border-[#242c3d] p-3 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                Ank Range Bets &bull; 2.0X
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { target: 'LOW', label: 'LOW (0 - 4)' },
                  { target: 'HIGH', label: 'HIGH (5 - 9)' },
                ].map((item) => {
                  const bet = bets.find((b) => b.category === 'range' && b.target === item.target);
                  return (
                    <button
                      key={item.target}
                      disabled={isDealing}
                      onClick={() => handleAddBet('range', item.target)}
                      className="py-2.5 rounded-xl bg-[#171e2c] hover:bg-[#20293d] text-xs font-bold text-gray-200 border border-[#242c3d] relative cursor-pointer"
                    >
                      <span>{item.label}</span>
                      {bet && (
                        <span className="absolute -top-1 -right-1 bg-[#d4af37] text-black text-[9px] font-black px-1 rounded-full shadow">
                          ₹{bet.amount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Poker Hands */}
            <div className="bg-[#121622] border border-[#242c3d] p-3 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                Poker Hands &bull; Multipliers
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { target: 'PAIR', label: 'Pair • 2.5X' },
                  { target: 'COLOR', label: 'Flush (Color) • 5.0X' },
                  { target: 'SEQUENCE', label: 'Sequence (Straight) • 10X' },
                  { target: 'TRIO', label: 'Trio (Trail) • 50X' },
                ].map((item) => {
                  const bet = bets.find((b) => b.category === 'poker' && b.target === item.target);
                  return (
                    <button
                      key={item.target}
                      disabled={isDealing}
                      onClick={() => handleAddBet('poker', item.target)}
                      className="py-2 rounded-xl bg-[#171e2c] hover:bg-[#20293d] text-xs font-bold text-amber-300 border border-amber-500/30 relative cursor-pointer"
                    >
                      <span>{item.label}</span>
                      {bet && (
                        <span className="absolute -top-1 -right-1 bg-[#d4af37] text-black text-[9px] font-black px-1 rounded-full shadow">
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

        {/* Bottom Chip Selectors & Deal Controls */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121622] p-4 rounded-2xl border border-[#242c3d]">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-gray-400 font-bold mr-1">Chips:</span>
            {[20, 50, 100, 200, 500].map((chip) => (
              <button
                key={chip}
                disabled={isDealing}
                onClick={() => setSelectedChip(chip)}
                className={`w-10 h-10 rounded-full font-black text-xs border-2 shadow-md flex items-center justify-center transition-all cursor-pointer ${
                  selectedChip === chip
                    ? 'scale-110 border-amber-300 bg-gradient-to-r from-amber-400 to-yellow-600 text-black ring-2 ring-amber-400/50'
                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-400'
                }`}
              >
                ₹{chip}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              disabled={isDealing || bets.length === 0}
              onClick={clearAllBets}
              className="px-4 py-3 rounded-xl text-xs font-bold bg-[#1a2130] hover:bg-[#253046] text-gray-300 border border-[#242c3d] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Bets</span>
            </button>

            <button
              disabled={isDealing || totalBet <= 0}
              onClick={handleDeal}
              className={`flex-1 sm:flex-none px-8 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDealing || totalBet <= 0
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-[#d4af37] to-yellow-500 text-black hover:brightness-110 shadow-[0_0_25px_rgba(245,208,97,0.4)]'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isDealing ? 'animate-spin' : ''}`} />
              <span>{isDealing ? 'Dealing Cards...' : `DEAL CARDS (₹${totalBet})`}</span>
            </button>
          </div>
        </div>
      </div>

      <GameScoreboard gameType="MATKA_POKER" gameTitle="Matka Poker" />
    </div>
  );
};

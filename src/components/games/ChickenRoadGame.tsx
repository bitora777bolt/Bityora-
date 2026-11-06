import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/soundEffects';
import {
  Sparkles,
  Footprints,
  Minus,
  Plus,
  Trophy,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Car,
  CheckCircle2,
  Coins,
  ArrowRight,
  Flame,
  Volume2,
} from 'lucide-react';
import { GameScoreboard } from '../common/GameScoreboard';

interface RoadLane {
  lane: number;
  name: string;
  hazard: string;
  points: number; // 1 to 10
  multiplier: number; // 1.10x to 2.00x
  survivalRate: number; // percentage
  carType: 'ferrari' | 'sedan' | 'truck' | 'police' | 'cyber' | 'limo';
  direction: 'right' | 'left';
  speedClass: string;
}

const ROAD_LANES: RoadLane[] = [
  { lane: 1, name: 'Suburban Lane 1', hazard: 'Urban Sedans', points: 1, multiplier: 1.10, survivalRate: 85, carType: 'sedan', direction: 'right', speedClass: 'animate-car-right-slow' },
  { lane: 2, name: 'Metro Boulevard 2', hazard: 'Electric Cabs', points: 2, multiplier: 1.20, survivalRate: 80, carType: 'sedan', direction: 'left', speedClass: 'animate-car-left-normal' },
  { lane: 3, name: 'Neon Avenue 3', hazard: 'Hyper Supercars', points: 3, multiplier: 1.30, survivalRate: 75, carType: 'ferrari', direction: 'right', speedClass: 'animate-car-right-normal' },
  { lane: 4, name: 'Transit Highway 4', hazard: 'Armored Convoys', points: 4, multiplier: 1.40, survivalRate: 70, carType: 'truck', direction: 'left', speedClass: 'animate-car-left-slow' },
  { lane: 5, name: 'High-Roller Strip 5', hazard: 'Golden Supercars', points: 5, multiplier: 1.50, survivalRate: 65, carType: 'ferrari', direction: 'right', speedClass: 'animate-car-right-fast' },
  { lane: 6, name: 'Patrol Ringway 6', hazard: 'Police Interceptors', points: 6, multiplier: 1.60, survivalRate: 60, carType: 'police', direction: 'left', speedClass: 'animate-car-left-fast' },
  { lane: 7, name: 'Dragon Speedway 7', hazard: 'Nitro Racers', points: 7, multiplier: 1.70, survivalRate: 55, carType: 'cyber', direction: 'right', speedClass: 'animate-car-right-fast' },
  { lane: 8, name: 'Executive Expressway 8', hazard: 'VIP Limousines', points: 8, multiplier: 1.80, survivalRate: 50, carType: 'limo', direction: 'left', speedClass: 'animate-car-left-normal' },
  { lane: 9, name: 'Quantum Super-Lane 9', hazard: 'Supersonic Cruisers', points: 9, multiplier: 1.90, survivalRate: 45, carType: 'cyber', direction: 'right', speedClass: 'animate-car-right-fast' },
  { lane: 10, name: 'Sanctuary Portal 10', hazard: 'Grand Finale Traffic', points: 10, multiplier: 2.00, survivalRate: 40, carType: 'ferrari', direction: 'left', speedClass: 'animate-car-left-slow' },
];

// SVG Car Graphic with headlights and glowing body
const CarGraphic: React.FC<{
  type: RoadLane['carType'];
  direction: 'right' | 'left';
}> = ({ type, direction }) => {
  const isRight = direction === 'right';

  const headlightBeam = (
    <div
      className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${
        isRight
          ? 'left-full w-24 sm:w-32 h-8 bg-gradient-to-r from-amber-200/40 via-yellow-200/15 to-transparent'
          : 'right-full w-24 sm:w-32 h-8 bg-gradient-to-l from-amber-200/40 via-yellow-200/15 to-transparent'
      }`}
      style={{
        clipPath: isRight
          ? 'polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)'
          : 'polygon(100% 40%, 0% 0%, 0% 100%, 100% 60%)',
      }}
    />
  );

  return (
    <div className={`relative flex items-center ${isRight ? '' : 'scale-x-[-1]'}`}>
      {headlightBeam}

      {type === 'ferrari' && (
        <svg width="68" height="24" viewBox="0 0 100 36" fill="none" className="drop-shadow-md">
          <path d="M10 26 L18 14 L36 10 L68 10 L84 18 L94 22 L94 28 L10 28 Z" fill="#e11d48" />
          <path d="M38 11 L64 11 L74 18 L32 18 Z" fill="#0f172a" />
          <line x1="20" y1="20" x2="90" y2="20" stroke="#f5d061" strokeWidth="2" />
          <circle cx="28" cy="28" r="7" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          <circle cx="28" cy="28" r="3" fill="#f5d061" />
          <circle cx="78" cy="28" r="7" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          <circle cx="78" cy="28" r="3" fill="#f5d061" />
          <ellipse cx="92" cy="21" rx="2" ry="3" fill="#fef08a" />
        </svg>
      )}

      {type === 'sedan' && (
        <svg width="64" height="24" viewBox="0 0 100 36" fill="none" className="drop-shadow-md">
          <path d="M8 26 L16 16 L32 10 L64 10 L78 16 L92 22 L92 28 L8 28 Z" fill="#eab308" />
          <path d="M34 12 L60 12 L72 17 L30 17 Z" fill="#1e293b" />
          <circle cx="26" cy="28" r="7" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="26" cy="28" r="3" fill="#fef08a" />
          <circle cx="76" cy="28" r="7" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="76" cy="28" r="3" fill="#fef08a" />
          <rect x="90" y="21" width="3" height="4" rx="1" fill="#fff" />
        </svg>
      )}

      {type === 'truck' && (
        <svg width="78" height="28" viewBox="0 0 120 40" fill="none" className="drop-shadow-md">
          <rect x="8" y="6" width="70" height="26" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
          <path d="M78 12 L96 16 L108 24 L108 32 L78 32 Z" fill="#1e293b" />
          <line x1="12" y1="18" x2="20" y2="26" stroke="#f59e0b" strokeWidth="3" />
          <line x1="28" y1="18" x2="36" y2="26" stroke="#f59e0b" strokeWidth="3" />
          <circle cx="24" cy="33" r="6" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="44" cy="33" r="6" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="94" cy="33" r="6" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="106" y="25" width="3" height="5" rx="1" fill="#fef08a" />
        </svg>
      )}

      {type === 'police' && (
        <svg width="68" height="24" viewBox="0 0 100 36" fill="none" className="drop-shadow-md">
          <path d="M10 26 L18 16 L34 11 L66 11 L78 16 L90 22 L90 28 L10 28 Z" fill="#090d16" />
          <rect x="36" y="16" width="28" height="12" fill="#f8fafc" />
          <rect x="46" y="7" width="6" height="4" rx="1" fill="#ef4444" className="animate-ping" />
          <rect x="52" y="7" width="6" height="4" rx="1" fill="#3b82f6" />
          <circle cx="28" cy="28" r="7" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="76" cy="28" r="7" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="88" y="21" width="3" height="4" rx="1" fill="#fef08a" />
        </svg>
      )}

      {type === 'cyber' && (
        <svg width="70" height="24" viewBox="0 0 100 36" fill="none" className="drop-shadow-md">
          <path d="M8 26 L14 14 L38 8 L72 8 L86 16 L94 22 L94 28 L8 28 Z" fill="#06b6d4" />
          <line x1="16" y1="28" x2="88" y2="28" stroke="#22d3ee" strokeWidth="3" />
          <circle cx="28" cy="28" r="7" fill="#082f49" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="78" cy="28" r="7" fill="#082f49" stroke="#38bdf8" strokeWidth="2" />
          <polygon points="90,20 95,22 90,24" fill="#a5f3fc" />
        </svg>
      )}

      {type === 'limo' && (
        <svg width="80" height="24" viewBox="0 0 120 36" fill="none" className="drop-shadow-md">
          <rect x="10" y="16" width="94" height="12" rx="2" fill="#0f172a" />
          <path d="M14 16 L22 10 L94 10 L102 16 Z" fill="#1e293b" stroke="#d4af37" strokeWidth="1" />
          <circle cx="24" cy="28" r="6" fill="#020617" stroke="#f5d061" strokeWidth="2" />
          <circle cx="88" cy="28" r="6" fill="#020617" stroke="#f5d061" strokeWidth="2" />
          <rect x="102" y="19" width="3" height="4" rx="1" fill="#fef08a" />
        </svg>
      )}
    </div>
  );
};

// Animated Realistic Rooster Mascot Component
const RealisticAnimatedChicken: React.FC<{
  state: 'idle' | 'walking' | 'crashed' | 'celebrating';
}> = ({ state }) => {
  return (
    <div className="relative flex flex-col items-center select-none">
      {state === 'celebrating' && (
        <div className="absolute -top-5 text-sm animate-bounce z-20">
          👑
        </div>
      )}

      {state === 'crashed' && (
        <div className="absolute -top-4 text-xs flex gap-1 z-20 animate-spin">
          <span>💫</span>
          <span>💥</span>
        </div>
      )}

      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 relative flex items-center justify-center transition-all ${
          state === 'walking'
            ? 'animate-chicken-waddle'
            : state === 'crashed'
            ? 'animate-chicken-panic opacity-75'
            : state === 'celebrating'
            ? 'scale-125 drop-shadow-[0_0_15px_rgba(245,208,97,0.9)]'
            : 'animate-pulse'
        }`}
      >
        {/* Realistic SVG Chicken Mascot */}
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
          <ellipse cx="46" cy="60" rx="26" ry="20" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M 24,56 Q 38,72 52,60 Q 40,48 24,56 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="68" cy="40" r="16" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
          {/* Comb */}
          <path d="M 62,24 Q 68,14 74,24 Q 80,16 84,28" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Wattle */}
          <ellipse cx="76" cy="54" rx="4" ry="7" fill="#ef4444" />
          {/* Beak */}
          <polygon points="80,42 94,46 80,50" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
          {/* Eye */}
          <circle cx="74" cy="38" r="4.5" fill="#000" />
          <circle cx="75" cy="36" r="1.5" fill="#fff" />
          {/* Legs */}
          <line x1="40" y1="78" x2="40" y2="92" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <line x1="52" y1="78" x2="56" y2="92" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

export const ChickenRoadGame: React.FC = () => {
  const { currentUser, recordGameRound } = useGame();

  // Wager: Min ₹10, Max ₹100 as strictly required by user
  const [wager, setWager] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLane, setCurrentLane] = useState<number>(0); // 0 = curb, 1 to 10 = lanes
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<'WIN' | 'LOSS' | null>(null);
  const [chickenState, setChickenState] = useState<'idle' | 'walking' | 'crashed' | 'celebrating'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Select your wager (₹10 - ₹100) and start crossing!');

  // Points & Profit Calculation:
  // "જો એ રોડ ક્રોસ કરે તો 10 માંથી એક પોઈન્ટ એટલે એક રૂપિયો મળે. 10 રૂપિયાની બેટ લગાડી હોય તો હાલે તો એક પોઈન્ટ મળે. રોડ ક્રોસ થઈ ગયો તો એક પોઈન્ટ મળશે."
  // Profit = currentLane * (wager * 0.10)
  // Payout = wager + profit
  const pointsEarned = currentLane;
  const currentProfit = Number((currentLane * (wager * 0.10)).toFixed(2));
  const currentCashoutPayout = Number((wager + currentProfit).toFixed(2));
  const currentMultiplier = currentLane > 0 ? Number((1 + currentLane * 0.10).toFixed(2)) : 1.0;

  const handleWagerChange = (val: number) => {
    sounds.chipClick();
    const clamped = Math.min(100, Math.max(10, Math.floor(val)));
    setWager(clamped);
  };

  const handleDoubleWager = () => {
    sounds.chipClick();
    setWager(prev => Math.min(100, prev * 2));
  };

  const handleHalfWager = () => {
    sounds.chipClick();
    setWager(prev => Math.max(10, Math.floor(prev / 2)));
  };

  // Start new game run
  const handleStartRun = () => {
    if (!currentUser || currentUser.balance < wager) {
      alert(`Insufficient balance. Your balance is ₹${currentUser?.balance?.toFixed(2) || '0.00'}.`);
      return;
    }

    sounds.chipClick();
    setCurrentLane(0);
    setIsPlaying(true);
    setIsGameOver(false);
    setGameResult(null);
    setChickenState('idle');
    setStatusMessage('Run started! Chicken is on the curb. Click "CROSS LANE 1" to proceed.');
  };

  // Cross the next lane
  const handleCrossNextLane = () => {
    if (!isPlaying || isGameOver || currentLane >= ROAD_LANES.length) return;

    const targetLaneIndex = currentLane;
    const targetLaneData = ROAD_LANES[targetLaneIndex];

    setChickenState('walking');
    sounds.chickenHop();
    sounds.carWhoosh();

    setTimeout(() => {
      // Survival Check
      const roll = Math.random() * 100;
      const isSafe = roll <= targetLaneData.survivalRate;

      if (isSafe) {
        // Successful Lane Crossing!
        // "જો એ રોડ ક્રોસ કરે ને સક્સેસફુલી રોડ ક્રોસ કરી લીધો તો એ રોડ બંધ થઈ જાય પછી બીજો રોડ ચાલુ થાય."
        const newLaneNumber = currentLane + 1;
        setCurrentLane(newLaneNumber);

        if (newLaneNumber === ROAD_LANES.length) {
          // Finished all 10 lanes!
          setIsGameOver(true);
          setIsPlaying(false);
          setGameResult('WIN');
          setChickenState('celebrating');

          const finalProfit = Number((10 * (wager * 0.10)).toFixed(2));
          const finalPayout = Number((wager + finalProfit).toFixed(2));

          setStatusMessage(`GRAND JACKPOT! Crossed all 10 lanes! Won ₹${finalPayout.toFixed(2)} (+10 Points / +₹${finalProfit.toFixed(2)} Profit)!`);
          sounds.cashOutWin();

          recordGameRound(
            'CHICKEN_ROAD',
            'Chicken Road',
            wager,
            2.00,
            finalPayout,
            'Crossed all 10 Highway Lanes safely (+10 Points)'
          );
        } else {
          setChickenState('idle');
          const nextProfit = Number((newLaneNumber * (wager * 0.10)).toFixed(2));
          const nextPayout = Number((wager + nextProfit).toFixed(2));
          setStatusMessage(`Lane ${newLaneNumber} SECURED & CLOSED! +${newLaneNumber} Point (+₹${nextProfit.toFixed(2)}). Current Payout: ₹${nextPayout.toFixed(2)}.`);
          sounds.gemReveal();
        }
      } else {
        // Car Accident / Collision:
        // "જો ગાડી હારે બટકાઈ ગયું ગાડી માથેથી હાલી ગઈ તો બધું ઝીરો અને જો ત્રીજા પટ્ટા પર એક્સિડન્ટ થઈ ગયું તો બધું ઝીરો"
        setIsGameOver(true);
        setIsPlaying(false);
        setGameResult('LOSS');
        setChickenState('crashed');
        setStatusMessage(`CAR COLLISION on Lane ${targetLaneData.lane}! Everything is ZERO. Lost ₹${wager.toFixed(2)}.`);
        sounds.carHonk();
        sounds.mineExplode();

        recordGameRound(
          'CHICKEN_ROAD',
          'Chicken Road',
          wager,
          0,
          0,
          `Car collision on Lane ${targetLaneData.lane} (${targetLaneData.hazard}) - Zero return`
        );
      }
    }, 320);
  };

  // Cash Out at current lane
  const handleCashOut = () => {
    if (!isPlaying || isGameOver || currentLane === 0) return;

    setIsGameOver(true);
    setIsPlaying(false);
    setGameResult('WIN');
    setChickenState('celebrating');
    setStatusMessage(`CASHED OUT! Secured ₹${currentCashoutPayout.toFixed(2)} (+${pointsEarned} Points / +₹${currentProfit.toFixed(2)} Profit)!`);
    sounds.cashOutWin();

    recordGameRound(
      'CHICKEN_ROAD',
      'Chicken Road',
      wager,
      currentMultiplier,
      currentCashoutPayout,
      `Cashed out safely at Lane ${currentLane} (+${pointsEarned} Points)`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* 1. Hero Banner featuring Authentic Uploaded Chicken Road Artwork */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-yellow-500/60 bg-gradient-to-b from-[#2b0c16] via-[#1a0810] to-[#0c0407] shadow-[0_0_50px_rgba(234,179,8,0.3)] p-5 sm:p-7">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 justify-between">
          {/* Left Text */}
          <div className="space-y-3.5 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>HIGHWAY CROSSING &bull; ₹10 - ₹100 WAGERS</span>
            </div>

            <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-white leading-tight tracking-wide">
              CHICKEN <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(234,179,8,0.5)]">ROAD</span>
            </h1>

            <p className="text-sm text-gray-300 leading-relaxed">
              Guide the chicken across 10 speeding traffic lanes! Each successfully crossed lane awards <strong>+1 Point</strong> (+10% profit). When a lane is cleared, <strong>that road closes down completely and cars stop running there</strong>! But if hit by a car on any lane, <strong>everything becomes Zero</strong>. Cash out at any closed lane!
            </p>

            {/* Rules Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1 text-xs font-mono-numbers">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-yellow-500/50 text-yellow-300">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span>+1 Point (+10% Profit) Per Lane</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/50 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cleared Roads Close Down</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-red-500/50 text-red-300">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Car Crash = Total Zero</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 text-amber-300">
                <span>Wagers: ₹10 to ₹100</span>
              </span>
            </div>
          </div>

          {/* Right Official Chicken Road Artwork Asset */}
          <div className="relative group flex-shrink-0">
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-3xl overflow-hidden border-2 border-yellow-400/80 shadow-[0_0_35px_rgba(234,179,8,0.45)] bg-gradient-to-b from-[#200912] via-[#14060b] to-[#070204] flex items-center justify-center p-2.5">
              <img
                src="/assets/aistudio/9739b6b510dd1509c7f22bb0ae43a43e_66b08bde.jpg"
                alt="Chicken Road Official Mascot"
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(234,179,8,0.7)] group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />

              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 border border-yellow-200 text-black font-black text-[11px] shadow-lg flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>OFFICIAL ARENA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Game Arena & Betting Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Console: Betting Controls & Cash Out (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-5 rounded-3xl bg-gradient-to-b from-[#131924] via-[#0e131d] to-[#090d14] border border-[#243147] p-5 sm:p-6 shadow-xl">
          {/* Unified Balance Display */}
          <div className="rounded-2xl bg-[#090d14] border border-[#1f2b3e] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-mono-numbers text-gray-400">UNIFIED BALANCE</p>
                <p className="text-lg font-mono-numbers font-black text-white">
                  ₹{currentUser?.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              Active
            </div>
          </div>

          {/* Wager Configuration (Strictly ₹10 to ₹100 as specified) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-yellow-400" />
                <span>Wager Amount (₹10 - ₹100)</span>
              </label>
              <span className="text-[11px] font-mono-numbers text-yellow-400">
                Current: ₹{wager}
              </span>
            </div>

            {/* Direct Input & Stepper */}
            <div className="flex items-center gap-2">
              <button
                disabled={isPlaying || wager <= 10}
                onClick={() => handleWagerChange(wager - 10)}
                className="w-11 h-11 rounded-xl bg-[#1b2333] hover:bg-[#253147] disabled:opacity-40 border border-[#2a3850] flex items-center justify-center text-white font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={10}
                  max={100}
                  disabled={isPlaying}
                  value={wager}
                  onChange={e => handleWagerChange(Number(e.target.value))}
                  className="w-full h-11 rounded-xl bg-[#090d14] border border-[#2a3850] focus:border-yellow-400 pl-8 pr-3 text-white font-mono-numbers font-bold text-base focus:outline-none transition-all"
                />
              </div>

              <button
                disabled={isPlaying || wager >= 100}
                onClick={() => handleWagerChange(wager + 10)}
                className="w-11 h-11 rounded-xl bg-[#1b2333] hover:bg-[#253147] disabled:opacity-40 border border-[#2a3850] flex items-center justify-center text-white font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Chips (Half, Double, Min, Max) */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                disabled={isPlaying}
                onClick={handleHalfWager}
                className="py-1.5 rounded-lg bg-[#182130] hover:bg-[#233148] disabled:opacity-40 border border-[#293954] text-[11px] font-bold text-gray-300 transition-colors"
              >
                1/2
              </button>
              <button
                disabled={isPlaying}
                onClick={handleDoubleWager}
                className="py-1.5 rounded-lg bg-[#182130] hover:bg-[#233148] disabled:opacity-40 border border-[#293954] text-[11px] font-bold text-gray-300 transition-colors"
              >
                2X
              </button>
              <button
                disabled={isPlaying}
                onClick={() => handleWagerChange(10)}
                className="py-1.5 rounded-lg bg-[#182130] hover:bg-[#233148] disabled:opacity-40 border border-[#293954] text-[11px] font-bold text-amber-300 transition-colors"
              >
                MIN (₹10)
              </button>
              <button
                disabled={isPlaying}
                onClick={() => handleWagerChange(100)}
                className="py-1.5 rounded-lg bg-[#182130] hover:bg-[#233148] disabled:opacity-40 border border-[#293954] text-[11px] font-bold text-amber-400 transition-colors"
              >
                MAX (₹100)
              </button>
            </div>

            {/* Presets within ₹10 to ₹100 */}
            <div className="grid grid-cols-6 gap-1 pt-1">
              {[10, 20, 30, 50, 75, 100].map(amt => (
                <button
                  key={amt}
                  disabled={isPlaying}
                  onClick={() => handleWagerChange(amt)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    wager === amt
                      ? 'bg-yellow-400 text-black border border-yellow-200 shadow-md font-black'
                      : 'bg-[#121824] hover:bg-[#1a2333] border border-[#222e42] text-gray-300'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: START RUN, CROSS LANE, or CASH OUT */}
          <div className="pt-2">
            {!isPlaying ? (
              <button
                onClick={handleStartRun}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-black font-black text-lg tracking-wider uppercase shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Footprints className="w-5 h-5" />
                <span>START CROSSING (₹{wager})</span>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Step to Next Lane Button */}
                <button
                  disabled={isGameOver || currentLane >= ROAD_LANES.length}
                  onClick={handleCrossNextLane}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 disabled:opacity-50 text-black font-black text-lg tracking-wider uppercase shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Footprints className="w-5 h-5" />
                  <span>
                    CROSS LANE {currentLane + 1} (+1 POINT)
                  </span>
                </button>

                {/* Cash Out Button */}
                {currentLane > 0 && !isGameOver && (
                  <button
                    onClick={handleCashOut}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-base tracking-wide uppercase shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-black" />
                      <span>CASH OUT NOW</span>
                    </div>
                    <span className="text-xs font-mono text-black font-bold">
                      ₹{currentCashoutPayout.toFixed(2)} (+{pointsEarned} Pts / +₹{currentProfit.toFixed(2)} Profit)
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Real-time Status Card */}
          <div className="rounded-2xl bg-[#090d14] border border-[#1f2b3e] p-4 space-y-2 text-xs font-mono-numbers">
            <div className="flex justify-between text-gray-400">
              <span>Points Earned:</span>
              <span className="text-yellow-300 font-black text-sm">+{pointsEarned} Points</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Current Lane:</span>
              <span className="text-white font-bold">
                {currentLane === 0 ? 'Starting Curb' : `Lane ${currentLane} (Secured)`}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Profit Multiplier:</span>
              <span className="text-emerald-400 font-bold">{currentMultiplier.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between text-gray-400 pt-1 border-t border-[#1b2536]">
              <span>Cashout Value:</span>
              <span className="text-yellow-400 font-black text-sm">
                ₹{currentCashoutPayout.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Area: 10 Highway Road Lanes with Progressive Road Closures (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="relative rounded-3xl overflow-hidden border border-[#2b3a52] bg-gradient-to-b from-[#101620] via-[#0b0e15] to-[#06080d] p-4 sm:p-5 shadow-2xl">
            {/* Top Bar: Sanctuary Finish Line */}
            <div className="relative z-10 flex items-center justify-between pb-3 mb-2 border-b border-[#1f2b3e] px-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
                  👑
                </div>
                <div>
                  <h3 className="font-cinzel text-sm sm:text-base font-bold text-white tracking-wider">
                    HIGHWAY CROSSING ARENA (10 LANES)
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono-numbers">
                    {statusMessage}
                  </p>
                </div>
              </div>

              {pointsEarned > 0 && !isGameOver && (
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+{pointsEarned} POINTS BANKABLE!</span>
                </div>
              )}
            </div>

            {/* 10 ROAD LANES (Rendered Top-to-Bottom: Lane 10 down to Lane 1) */}
            <div className="relative divide-y divide-[#1e2738]/60 rounded-2xl overflow-hidden border border-[#243147]">
              {/* Grand Finish Line Sanctuary at the top */}
              <div className="h-12 bg-gradient-to-r from-[#18231c] via-[#0f2d1e] to-[#18231c] flex items-center justify-between px-4 border-b-2 border-yellow-400/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏁</span>
                  <span className="text-xs font-black text-yellow-300 uppercase tracking-wider">
                    FINISH LINE SANCTUARY (10 POINTS / 2.0X)
                  </span>
                </div>
                {currentLane === 10 && (
                  <div className="flex items-center gap-2 bg-yellow-400 text-black px-2.5 py-0.5 rounded-lg font-black text-xs animate-bounce">
                    <RealisticAnimatedChicken state="celebrating" />
                    <span>SANCTUARY REACHED!</span>
                  </div>
                )}
              </div>

              {/* 10 Road Lanes in reverse order so Lane 1 is at bottom, Lane 10 at top */}
              {[...ROAD_LANES].reverse().map(laneData => {
                const isPassed = currentLane >= laneData.lane;
                const isCurrent = currentLane === laneData.lane;
                const isNext = currentLane + 1 === laneData.lane;

                return (
                  <div
                    key={laneData.lane}
                    className={`relative h-13 sm:h-14 flex items-center px-4 overflow-hidden transition-all ${
                      isPassed
                        ? 'bg-[#081a12] border-l-4 border-emerald-500' // CLOSED / SECURED LANE
                        : isNext && isPlaying
                        ? 'bg-[#182333] border-l-4 border-yellow-400' // UPCOMING ACTIVE HAZARD
                        : 'bg-[#0d121c]'
                    }`}
                  >
                    {/* Asphalt road dashed dividing line */}
                    <div
                      className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] opacity-30 pointer-events-none"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(to right, #ffffff, #ffffff 16px, transparent 16px, transparent 32px)',
                      }}
                    />

                    {/* TRAFFIC CARS:
                        "જો એ રોડ ક્રોસ કરે ને સક્સેસફુલી રોડ ક્રોસ કરી લીધો તો એ રોડ બંધ થઈ જાય પછી બીજો રોડ ચાલુ થાય.
                         જો બીજો પટ્ટો ક્રોસ કરી લીધો તો એ રોડ પણ બંધ થઈ જાય એની ત્યાં ગાડી હાલે નહીં"
                        When lane is passed, TRAFFIC STOPS COMPLETELY (Road Closes)!
                    */}
                    {!isPassed ? (
                      /* Active speeding traffic */
                      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center">
                        <div className={`absolute ${laneData.speedClass}`}>
                          <CarGraphic type={laneData.carType} direction={laneData.direction} />
                        </div>
                      </div>
                    ) : (
                      /* Closed Road Barricade & Secure Safe Zone */
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                          <span>🚧</span>
                          <span>ROAD CLOSED &bull; TRAFFIC HALTED</span>
                          <span>🚧</span>
                        </div>
                      </div>
                    )}

                    {/* Lane Info Pill (Left) */}
                    <div className="relative z-10 flex items-center gap-2.5 min-w-[130px] sm:min-w-[180px]">
                      <span
                        className={`w-6 h-6 rounded-full border text-[11px] font-mono-numbers font-bold flex items-center justify-center shrink-0 ${
                          isPassed
                            ? 'bg-emerald-500 border-emerald-300 text-black font-black'
                            : isNext && isPlaying
                            ? 'bg-yellow-400 border-yellow-200 text-black font-black animate-pulse'
                            : 'bg-[#151c28] border-[#293649] text-gray-400'
                        }`}
                      >
                        {laneData.lane}
                      </span>
                      <div>
                        <p className="text-[11px] sm:text-xs font-bold text-white truncate drop-shadow">
                          {laneData.name}
                        </p>
                        <p className="text-[9px] font-mono-numbers text-gray-400">
                          {isPassed ? (
                            <span className="text-emerald-400 font-bold">Closed &bull; Safe Zone</span>
                          ) : (
                            <span>{laneData.hazard}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Center: Chicken Location when currently standing on this lane */}
                    <div className="relative z-20 flex-1 flex items-center justify-center">
                      {isCurrent && (
                        <div className="flex items-center gap-2 animate-in zoom-in-75 duration-200">
                          <RealisticAnimatedChicken state={chickenState} />
                          <div className="px-2 py-0.5 bg-yellow-400 text-black text-[10px] font-black rounded-lg shadow uppercase">
                            Lane {laneData.lane} (+{laneData.points} Pt)
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Point & Multiplier Badge */}
                    <div className="relative z-10 flex items-center gap-2 justify-end min-w-[90px]">
                      {isPassed ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold font-mono-numbers bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>+{laneData.points} Pt</span>
                        </span>
                      ) : (
                        <span
                          className={`font-mono-numbers text-xs font-black px-2 py-0.5 rounded ${
                            isNext && isPlaying
                              ? 'bg-yellow-400 text-black'
                              : 'text-yellow-400 bg-black/50 border border-[#242c3d]'
                          }`}
                        >
                          +{laneData.points} Pt ({laneData.multiplier.toFixed(2)}x)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Starting Curb (Sidewalk) at bottom */}
              <div
                className={`relative px-4 py-3 flex items-center justify-between transition-colors ${
                  currentLane === 0 ? 'bg-[#151d2a] border-t-2 border-yellow-400/60' : 'bg-[#0d1117] text-gray-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Footprints className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Starting Sidewalk (Safe Curb)</span>
                </div>

                {currentLane === 0 && (
                  <div className="flex items-center gap-2">
                    <RealisticAnimatedChicken state={chickenState} />
                    <span className="text-[11px] font-black text-yellow-300 bg-[#1e2738] px-2.5 py-0.5 rounded-lg border border-yellow-400/40">
                      ON CURB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Collision Alert Banner */}
            {isGameOver && gameResult === 'LOSS' && (
              <div className="mt-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-neutral-900 to-neutral-950 border-2 border-red-500/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500 flex items-center justify-center text-2xl flex-shrink-0">
                    💥
                  </div>
                  <div>
                    <h4 className="font-cinzel text-base font-black text-red-300">
                      CAR COLLISION! EVERYTHING IS ZERO
                    </h4>
                    <p className="text-xs text-gray-300 font-mono-numbers">
                      The chicken was hit by a speeding vehicle! Total payout: <strong>₹0.00</strong> (Loss: <strong>-₹{wager.toFixed(2)}</strong>).
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartRun}
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                >
                  Try Again (₹{wager})
                </button>
              </div>
            )}

            {/* Victory / Cash Out Banner */}
            {isGameOver && gameResult === 'WIN' && (
              <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-yellow-950/50 to-neutral-950 border-2 border-yellow-400/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_35px_rgba(234,179,8,0.4)]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-2xl flex-shrink-0">
                    🏆
                  </div>
                  <div>
                    <h4 className="font-cinzel text-base font-black text-yellow-300">
                      CASH OUT SUCCESSFUL!
                    </h4>
                    <p className="text-xs text-gray-200 font-mono-numbers">
                      Crossed {currentLane} lanes safely! Points: <strong>+{pointsEarned}</strong> &bull; Payout: <strong className="text-yellow-300">₹{currentCashoutPayout.toFixed(2)}</strong> (+₹{currentProfit.toFixed(2)} Net Profit) credited to your balance!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartRun}
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                >
                  Play Next Run
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Live Leaderboard & Recent Winners Scoreboard */}
      <div className="pt-4">
        <GameScoreboard gameType="CHICKEN_ROAD" gameTitle="Chicken Road" />
      </div>
    </div>
  );
};

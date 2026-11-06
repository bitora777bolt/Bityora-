import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/soundEffects';
import {
  Compass,
  Sparkles,
  History,
  Zap,
  Flame,
  Minus,
  Plus,
  Crown,
  Trophy,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { GameScoreboard } from '../common/GameScoreboard';

// 16 Authentic Ancient Stone Sectors around the Maya Sundial Wheel (22.5 deg each)
export interface MayaWheelSector {
  index: number;
  label: string;
  sub: string;
  multiplier: number;
  isJackpot?: boolean;
  isHighTier?: boolean;
  isLoss?: boolean;
  colorName: string;
  badgeBg: string;
}

export const MAYA_SECTORS: MayaWheelSector[] = [
  { index: 0, label: '3.0x', sub: 'Invest & +2 Pts', multiplier: 3.0, colorName: 'Gold Sun', badgeBg: 'bg-amber-500/20 text-[#f5d061] border-amber-400/40' },
  { index: 1, label: '1.5x', sub: 'Sacred Jade', multiplier: 1.5, colorName: 'Jade Blue', badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40' },
  { index: 2, label: '2.0x', sub: 'Double Power', multiplier: 2.0, colorName: 'Purple Rune', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40' },
  { index: 3, label: '0.0x', sub: 'Hazard Trap', multiplier: 0.0, isLoss: true, colorName: 'Crimson Hazard', badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { index: 4, label: '5.0x', sub: 'Golden Idol', multiplier: 5.0, colorName: 'Gold Sun', badgeBg: 'bg-amber-500/20 text-[#f5d061] border-amber-400/40' },
  { index: 5, label: '3.0x', sub: 'Invest & +2 Pts', multiplier: 3.0, colorName: 'Jade Blue', badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40' },
  { index: 6, label: '2.0x', sub: 'Sun Dial', multiplier: 2.0, colorName: 'Purple Rune', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40' },
  { index: 7, label: '10.0x', sub: 'Temple Vault', multiplier: 10.0, colorName: 'Coral Altar', badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-400/40' },
  { index: 8, label: '0.0x', sub: 'Hazard Trap', multiplier: 0.0, isLoss: true, colorName: 'Crimson Hazard', badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { index: 9, label: '3.0x', sub: 'Invest & +2 Pts', multiplier: 3.0, colorName: 'Gold Sun', badgeBg: 'bg-amber-500/20 text-[#f5d061] border-amber-400/40' },
  { index: 10, label: '1.5x', sub: 'Sacred Jade', multiplier: 1.5, colorName: 'Jade Blue', badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40' },
  { index: 11, label: '50.0x', sub: 'Sun God Treasure', multiplier: 50.0, isHighTier: true, colorName: 'Sun Relic', badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-400/60' },
  { index: 12, label: '2.0x', sub: 'Double Power', multiplier: 2.0, colorName: 'Purple Rune', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40' },
  { index: 13, label: '0.0x', sub: 'Hazard Trap', multiplier: 0.0, isLoss: true, colorName: 'Crimson Hazard', badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { index: 14, label: '5.0x', sub: 'Golden Idol', multiplier: 5.0, colorName: 'Coral Altar', badgeBg: 'bg-amber-500/20 text-[#f5d061] border-amber-400/40' },
  { index: 15, label: '250.0x', sub: 'MAYA GRAND JACKPOT', multiplier: 250.0, isJackpot: true, colorName: 'Sacred Sun God', badgeBg: 'bg-gradient-to-r from-amber-500 to-rose-600 text-white border-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]' },
];

export const FortuneGame: React.FC = () => {
  const { currentUser, recordGameRound } = useGame();

  // Wager: Min 20, Step increments
  const [wager, setWager] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [selectedSector, setSelectedSector] = useState<MayaWheelSector | null>(null);
  const [lastWinPayout, setLastWinPayout] = useState<number>(0);
  const [showJackpotAlert, setShowJackpotAlert] = useState<boolean>(false);

  // 25-Spin Royal Jackpot Counter: Safe localStorage with fallback
  const [spinCycleCount, setSpinCycleCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bitora_maya_spins_v1');
      const parsed = saved ? parseInt(saved, 10) : 0;
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  });

  const [statusMessage, setStatusMessage] = useState<string>(
    'Spin the sacred Maya Wheel! 1 in 25 spins triggers the 50x - 250x Grand Jackpot Surge!'
  );
  const [recentWins, setRecentWins] = useState<number[]>([3.0, 2.0, 50.0, 1.5, 3.0, 250.0, 2.0]);

  const numSectors = MAYA_SECTORS.length; // 16
  const sectorAngleDeg = 360 / numSectors; // 22.5 deg

  // Current progress in the 25-spin cycle (1 to 25)
  const safeCount = isNaN(spinCycleCount) ? 0 : spinCycleCount;
  const currentSpinInCycle = (safeCount % 25) + 1;
  const is25thSpin = currentSpinInCycle === 25;
  const spinsRemainingToGuaranteedJackpot = 25 - currentSpinInCycle;

  // Persist spin counter
  useEffect(() => {
    try {
      localStorage.setItem('bitora_maya_wheel_spins_v1', safeCount.toString());
    } catch {
      // ignore storage errors
    }
  }, [safeCount]);

  // Spin the wheel
  const handleSpin = useCallback(() => {
    if (!currentUser) return;
    if (currentUser.isSuspended) {
      setStatusMessage('Account suspended by administrator. Cannot play.');
      return;
    }
    if (wager < 20) {
      setStatusMessage('Minimum bet requirement is ₹20 points.');
      return;
    }
    if (currentUser.balance < wager) {
      setStatusMessage(`Insufficient Winnings Balance. Available: ₹${currentUser.balance}`);
      return;
    }
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedSector(null);
    setShowJackpotAlert(false);
    sounds.chipClick();
    sounds.planeAscend();

    const nextCycleCount = safeCount + 1;
    // 1-in-25 odds rule: Guaranteed on 25th spin, or ~4% (1/25) random surge on any spin!
    const isJackpotHit = is25thSpin || Math.random() < 0.04;

    let chosenIndex: number;

    if (isJackpotHit) {
      // Land on 250.0x Maya Grand Jackpot (Sector 15) or 50.0x Sun God Treasure (Sector 11)
      chosenIndex = Math.random() < 0.65 ? 15 : 11;
      setSpinCycleCount(0); // Reset the 25-spin jackpot cycle
    } else {
      // Weighted non-jackpot distribution (3.0x, 2.0x, 1.5x, 5.0x, 10.0x, 0.0x)
      const weights: Record<number, number> = {
        0: 12,  // 3.0x
        1: 10,  // 1.5x
        2: 10,  // 2.0x
        3: 5,   // 0.0x
        4: 6,   // 5.0x
        5: 12,  // 3.0x
        6: 10,  // 2.0x
        7: 4,   // 10.0x
        8: 5,   // 0.0x
        9: 12,  // 3.0x
        10: 10, // 1.5x
        12: 10, // 2.0x
        13: 5,  // 0.0x
        14: 6,  // 5.0x
      };

      const candidateIndices = Object.keys(weights).map(Number);
      const totalWeight = candidateIndices.reduce((sum, idx) => sum + weights[idx], 0);
      let rand = Math.random() * totalWeight;
      chosenIndex = candidateIndices[0];

      for (const idx of candidateIndices) {
        if (rand < weights[idx]) {
          chosenIndex = idx;
          break;
        }
        rand -= weights[idx];
      }

      setSpinCycleCount(nextCycleCount);
    }

    const winningSector = MAYA_SECTORS[chosenIndex];

    // Compute exact rotation to align chosenSector with top pointer
    const targetSectorAngle = (360 - chosenIndex * sectorAngleDeg) % 360;
    const currentBase = rotation % 360;
    const fullSpins = 6 + Math.floor(Math.random() * 3); // 6 to 8 full revolutions
    const totalRotationTarget =
      rotation + fullSpins * 360 + ((targetSectorAngle - currentBase + 360) % 360);

    const startTime = performance.now();
    const duration = 4500; // 4.5s natural spin deceleration

    let lastTickAngle = rotation;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Smooth quintic ease-out deceleration
      const ease = 1 - Math.pow(1 - progress, 4.2);
      const currentRot = rotation + (totalRotationTarget - rotation) * ease;
      setRotation(currentRot);

      // Play tick sound when passing sector boundaries
      if (Math.abs(currentRot - lastTickAngle) >= sectorAngleDeg) {
        sounds.wheelTick();
        lastTickAngle = currentRot;
      }

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        // Spin finished!
        setIsSpinning(false);
        setSelectedSector(winningSector);

        const payout = Number((wager * winningSector.multiplier).toFixed(2));
        const profit = Number((payout - wager).toFixed(2));
        setLastWinPayout(payout);

        setRecentWins(prev => [winningSector.multiplier, ...prev.slice(0, 11)]);

        if (winningSector.multiplier > 0) {
          sounds.cashOutWin();
          if (winningSector.isJackpot || winningSector.multiplier >= 50.0) {
            setShowJackpotAlert(true);
            setStatusMessage(
              `🔥 SACRED MAYA GRAND JACKPOT! Landed on ${winningSector.label} (${winningSector.sub})! Won ₹${payout.toLocaleString('en-IN')} Demo Credits!`
            );
          } else if (winningSector.multiplier >= 3.0) {
            setStatusMessage(
              `VICTORY! Landed on ${winningSector.label}! Invested ₹${wager} and earned +₹${profit} profit (Payout: ₹${payout})!`
            );
          } else {
            setStatusMessage(
              `Landed on ${winningSector.label} (${winningSector.sub}) • Won ₹${payout}!`
            );
          }
        } else {
          sounds.mineExplode();
          setStatusMessage(
            `Hazard stone hit (0.0x)! Round lost ₹${wager}. Next spin approaches the 25-spin jackpot surge!`
          );
        }

        // Record round with correct positional parameters
        recordGameRound(
          'FORTUNE_WHEEL',
          'Maya Fortune Wheel',
          wager,
          winningSector.multiplier,
          payout,
          `Landed on ${winningSector.label} (${winningSector.sub})`
        );
      }
    };

    requestAnimationFrame(animate);
  }, [currentUser, wager, isSpinning, safeCount, is25thSpin, rotation, sectorAngleDeg, recordGameRound]);

  // Adjust wager helper
  const adjustWager = (delta: number) => {
    if (isSpinning) return;
    setWager(prev => {
      const next = prev + delta;
      return Math.max(20, Math.min(currentUser?.balance || 5000, next));
    });
  };

  const BET_PRESETS = [20, 50, 100, 200, 500];

  return (
    <div className="space-y-6">
      {/* Game Scoreboard */}
      <GameScoreboard
        gameTitle="Maya Fortune Wheel"
        gameType="FORTUNE_WHEEL"
      />

      {/* 1. Top Header Banner with 4K Maya Icon & 25-Spin Jackpot Gauge */}
      <div className="bg-[#0e121a] border border-[#d4af37]/35 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0c2417] via-[#101c15] to-[#0a0f18] border-2 border-[#d4af37]/60 flex items-center justify-center p-1 shadow-[0_0_20px_rgba(212,175,55,0.3)] relative group shrink-0">
            <img
              src="/assets/aistudio/6706b92b9c11a65518323f33bdb67a6a63d149e1_434e4681.webp"
              alt="4K Maya Wheel Icon"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform"
            />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 blur-[1px] animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                Maya Fortune Wheel
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-400/40 text-amber-300">
                25-SPIN JACKPOT SYSTEM
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              4K Ancient Temple Wheel • 1 in 25 Spins Hits 50x - 250x Grand Jackpot • 3.0x (+2 Pts Profit)
            </p>
          </div>
        </div>

        {/* 25-Spin Jackpot Meter HUD */}
        <div className="w-full lg:w-auto bg-[#080b11] border border-[#d4af37]/40 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-4 shrink-0 shadow-inner">
          <div className="space-y-1 text-left sm:text-right w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
              <span>25-Spin Jackpot Meter:</span>
              <span className="font-mono-numbers text-base font-black text-[#f5d061]">
                {currentSpinInCycle} / 25
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              {is25thSpin ? (
                <span className="text-yellow-300 font-bold animate-pulse">
                  ⚡ 25th Spin! High-Tier Jackpot Surge Active!
                </span>
              ) : (
                <span>Next Guaranteed Surge in {spinsRemainingToGuaranteedJackpot} Spins</span>
              )}
            </p>
          </div>

          {/* Progress Bar (25 segments visual) */}
          <div className="w-full sm:w-36 h-3 bg-[#151b26] rounded-full overflow-hidden border border-[#242c3d] p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${Math.min(100, (currentSpinInCycle / 25) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. THE SACRED MAYA WHEEL PLAY ARENA (Clean Proportions, No Distortion) */}
      <div className="bg-gradient-to-b from-[#0a111a] via-[#080d14] to-[#05070a] border-2 border-[#242c3d] rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Ambient Golden & Jungle Backlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-emerald-600/15 via-amber-500/20 to-purple-600/15 rounded-full blur-[80px] pointer-events-none" />

        {/* TOP POINTER MARKER (Golden Mayan Sun Needle with Glowing Ruby Arrowhead) */}
        <div className="relative z-30 flex flex-col items-center -mb-3 sm:-mb-5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-[#fde047] via-[#ca8a04] to-[#78350f] p-0.5 shadow-[0_0_20px_rgba(234,179,8,0.7)] flex items-center justify-center">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#18181b] flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </div>
          </div>
          {/* Arrowhead pointing down */}
          <div className="w-0 h-0 border-l-[10px] sm:border-l-[14px] border-l-transparent border-r-[10px] sm:border-r-[14px] border-r-transparent border-t-[18px] sm:border-t-[24px] border-t-amber-400 filter drop-shadow-[0_4px_10px_rgba(234,179,8,0.9)] -mt-1" />
        </div>

        {/* ROTATING 4K MAYA WHEEL CONTAINER: Preserves Natural Aspect Ratio & Circular Symmetry */}
        <div className="relative z-20 w-full max-w-[360px] sm:max-w-[420px] md:max-w-[460px] aspect-[1160/710] flex items-center justify-center my-3 sm:my-5">
          {/* Outer Ancient Temple Stone Ring with Glowing Aura */}
          <div className="absolute inset-2 sm:inset-3 rounded-full border-2 border-[#d4af37]/50 shadow-[0_0_35px_rgba(212,175,55,0.25)] pointer-events-none z-10" />

          {/* THE USER'S 4K MAYA WHEEL IMAGE (Rotates around natural image center, object-contain avoids all distortion) */}
          <div
            className="w-full h-full flex items-center justify-center select-none"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isSpinning ? 'none' : 'transform 0.4s ease-out',
            }}
          >
            <img
              src="/assets/aistudio/6706b92b9c11a65518323f33bdb67a6a63d149e1_434e4681.webp"
              alt="Maya Fortune Wheel"
              className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.85)]"
              draggable={false}
            />
          </div>

          {/* Center Stone Sun Disk Medallion Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#fde047] via-[#ca8a04] to-[#78350f] border-2 border-white/80 shadow-[0_0_20px_rgba(245,158,11,0.8)] z-20 flex items-center justify-center pointer-events-none">
            <span className="font-cinzel text-base font-black text-black">B</span>
          </div>
        </div>

        {/* Live Result Highlight Banner */}
        {selectedSector && (
          <div
            className={`mt-2 px-6 py-3 rounded-2xl border font-bold text-center text-sm sm:text-base animate-in zoom-in-95 duration-200 z-20 max-w-lg w-full shadow-2xl ${
              selectedSector.multiplier >= 50.0
                ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-purple-700 border-yellow-300 text-white shadow-[0_0_40px_rgba(245,158,11,0.8)]'
                : selectedSector.multiplier > 0
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
                : 'bg-red-950/90 border-red-500/60 text-red-300'
            }`}
          >
            {selectedSector.multiplier >= 50.0 ? (
              <div className="space-y-1">
                <span className="flex items-center justify-center gap-2 font-black text-yellow-300 uppercase tracking-widest text-base sm:text-lg">
                  <Crown className="w-5 h-5 text-yellow-300 animate-bounce" />
                  MAYA GRAND JACKPOT {selectedSector.label}!
                </span>
                <p className="text-xs text-white/90">
                  Payout: <strong className="font-mono text-yellow-200 text-lg">₹{lastWinPayout.toLocaleString('en-IN')}</strong> Demo Credits!
                </p>
              </div>
            ) : selectedSector.multiplier > 0 ? (
              <div>
                Landed on <strong>{selectedSector.label}</strong> ({selectedSector.sub}) • Won{' '}
                <strong className="text-emerald-200">₹{lastWinPayout.toLocaleString('en-IN')} Credits</strong> (+₹{(lastWinPayout - wager).toFixed(0)} profit)!
              </div>
            ) : (
              <div>
                Landed on Hazard Trap (0.0x) • Lost ₹{wager} Credits
              </div>
            )}
          </div>
        )}

        {/* Status Message */}
        <p className="text-xs text-gray-400 font-mono text-center mt-3 z-20">
          {statusMessage}
        </p>

        {/* Multiplier History Carousel */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto max-w-full py-1 z-20">
          <History className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="text-[10px] text-gray-500 font-semibold uppercase">History:</span>
          {recentWins.map((mult, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-numbers font-bold shrink-0 border ${
                mult >= 50.0
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white border-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : mult >= 5.0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : mult >= 2.0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-red-500/20 text-red-300 border-red-500/40'
              }`}
            >
              {mult.toFixed(1)}x
            </span>
          ))}
        </div>
      </div>

      {/* 3. WAGER CONTROLS & POINT INVESTMENT (DIRECTLY UNDERNEATH) */}
      <div className="bg-[#0e121a] border-2 border-[#d4af37]/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Point Investment Rule Card */}
        <div className="bg-gradient-to-r from-[#171306] via-[#241a06] to-[#171306] border border-[#d4af37]/35 rounded-xl p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#f5d061] font-bold">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Investment Rule: 3.0x returns ₹{wager} + ₹{(wager * 2).toFixed(0)} more profit!</span>
          </div>
          <span className="text-[11px] text-gray-300">
            Available Winnings: <strong className="text-emerald-400">₹{currentUser?.balance || 0}</strong>
          </span>
        </div>

        {/* Wager Stepper, Presets & Spin Action Button */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left: Quantity Adjuster (7 columns) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">
                Adjust Bet Amount (₹):
              </span>
              <span className="text-[11px] text-gray-400">
                Min: ₹20 • Potential 250x Win: <strong className="text-yellow-300 font-mono">₹{(wager * 250).toLocaleString('en-IN')}</strong>
              </span>
            </div>

            {/* Stepper with [-] and [+] Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSpinning || wager <= 20}
                onClick={() => adjustWager(-20)}
                title="Decrease by ₹20"
                className="w-12 h-12 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-gray-200 font-bold text-lg disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={20}
                  max={Math.min(5000, currentUser?.balance || 5000)}
                  disabled={isSpinning}
                  value={wager}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10) || 20;
                    setWager(Math.max(20, Math.min(currentUser?.balance || 5000, val)));
                  }}
                  className="w-full bg-[#121622] border-2 border-[#242c3d] focus:border-[#d4af37] rounded-xl pl-8 pr-4 py-3 text-base font-mono-numbers font-bold text-white focus:outline-none disabled:opacity-50 text-center"
                />
              </div>

              <button
                type="button"
                disabled={isSpinning || wager >= (currentUser?.balance || 5000)}
                onClick={() => adjustWager(20)}
                title="Increase by ₹20"
                className="w-12 h-12 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-gray-200 font-bold text-lg disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {BET_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => setWager(preset)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-mono-numbers font-bold border transition-all cursor-pointer ${
                    wager === preset
                      ? 'bg-amber-500/25 border-[#d4af37] text-white shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                      : 'bg-[#151b26] border-[#242c3d] text-gray-300 hover:border-[#d4af37]/40'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Right: SPIN ACTION BUTTON (5 columns) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <button
              type="button"
              disabled={isSpinning || (currentUser?.balance || 0) < wager}
              onClick={handleSpin}
              className="w-full py-4 px-6 rounded-2xl font-black text-black bg-gradient-to-r from-[#fde047] via-[#f59e0b] to-[#d97706] hover:brightness-110 shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider text-sm sm:text-base flex flex-col items-center justify-center gap-0.5"
            >
              {isSpinning ? (
                <span className="flex items-center gap-2">
                  <Compass className="w-5 h-5 animate-spin" />
                  MAYA WHEEL SPINNING...
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <Compass className="w-5 h-5" />
                    SPIN THE MAYA WHEEL
                  </span>
                  <span className="text-[10px] text-black/80 font-mono font-semibold">
                    Bet ₹{wager} • Up to ₹{(wager * 250).toLocaleString('en-IN')} Win
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import {
  DAILY_SPIN_SEGMENTS,
  SEGMENT_ANGLE,
  getUserDailySpinState,
  determineDailySpinOutcome,
  getFormattedCountdown,
  getSecondsUntilMidnight,
} from '../../utils/dailySpin';
import { sounds } from '../../utils/soundEffects';
import { DailySpinSegment } from '../../types';
import {
  X,
  Sparkles,
  Award,
  Crown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  Flame,
  Zap,
} from 'lucide-react';
import confetti from '../../utils/confetti';

interface DailySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailySpinModal: React.FC<DailySpinModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, creditDailySpinReward } = useGame();
  const [spinState, setSpinState] = useState(() =>
    currentUser ? getUserDailySpinState(currentUser.id) : null
  );

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [winningSegment, setWinningSegment] = useState<DailySpinSegment | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [countdownText, setCountdownText] = useState('');
  const [tickerTick, setTickerTick] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever modal opens or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setSpinState(getUserDailySpinState(currentUser.id));
    }
  }, [currentUser, isOpen]);

  // Live countdown timer until midnight
  useEffect(() => {
    const updateTimer = () => {
      const remaining = getSecondsUntilMidnight();
      setCountdownText(getFormattedCountdown(remaining));
      if (remaining === 0 && currentUser) {
        setSpinState(getUserDailySpinState(currentUser.id));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (!isOpen) return null;

  const handleExecuteSingleSpin = () => {
    if (!currentUser) {
      setErrorMessage('Please sign in to take your daily free spin!');
      return;
    }

    if (currentUser.accountStatus && currentUser.accountStatus !== 'ACTIVE') {
      setErrorMessage('Your account is restricted by administrator. Cannot spin.');
      return;
    }

    if (isSpinning) return;

    setErrorMessage(null);
    setShowCelebration(false);
    setWinningSegment(null);

    const result = determineDailySpinOutcome(currentUser.id);

    if (!result.success || !result.segment || result.targetAngle === undefined) {
      setErrorMessage(result.message || 'Unable to spin at this moment.');
      return;
    }

    const { segment, targetAngle, isJackpot } = result;

    setIsSpinning(true);
    sounds.chipClick();

    // Sound ticks simulation during spin deceleration
    const tickInterval = setInterval(() => {
      setTickerTick(prev => !prev);
      sounds.chipClick();
    }, 140);

    // Stop ticks near finish
    setTimeout(() => {
      clearInterval(tickInterval);
    }, 3800);

    // Apply rotation angle
    // Add cumulative rotation to prevent jumping backwards
    const finalAngle = currentRotation + targetAngle;
    setCurrentRotation(finalAngle);

    // When the wheel lands (after 4.5 seconds CSS transition)
    setTimeout(() => {
      setIsSpinning(false);
      setWinningSegment(segment);
      setShowCelebration(true);

      // Refresh state
      setSpinState(getUserDailySpinState(currentUser.id));

      if (segment.value > 0) {
        creditDailySpinReward(segment.value, Boolean(isJackpot));
        sounds.cashOutWin();

        // Trigger confetti celebration
        if (isJackpot) {
          confetti({
            particleCount: 180,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#f5d061', '#ffd700', '#ff4500', '#00e5ff'],
          });
        } else {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.65 },
            colors: ['#10b981', '#f5d061', '#06b6d4'],
          });
        }
      }
    }, 4500);
  };

  // Helper to generate SVG pie slices for the 7 segments
  const renderWheelSegments = () => {
    const size = 320;
    const center = size / 2;
    const radius = center - 14;

    return DAILY_SPIN_SEGMENTS.map((seg, idx) => {
      const startAngleDeg = idx * SEGMENT_ANGLE;
      const endAngleDeg = (idx + 1) * SEGMENT_ANGLE;
      const midAngleDeg = startAngleDeg + SEGMENT_ANGLE / 2;

      const startRad = (startAngleDeg * Math.PI) / 180;
      const endRad = (endAngleDeg * Math.PI) / 180;
      const midRad = (midAngleDeg * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

      // Text position along mid-angle (at 65% of radius)
      const textRadius = radius * 0.68;
      const tx = center + textRadius * Math.cos(midRad);
      const ty = center + textRadius * Math.sin(midRad);

      return (
        <g key={seg.id}>
          {/* Segment Slice */}
          <path
            d={pathData}
            fill={seg.color}
            stroke="#d4af37"
            strokeWidth="1.5"
            className="transition-colors"
          />

          {/* Segment Radial Highlights */}
          <line
            x1={center}
            y1={center}
            x2={x1}
            y2={y1}
            stroke="#f5d061"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />

          {/* Value Label */}
          <g transform={`translate(${tx}, ${ty}) rotate(${midAngleDeg + 90})`}>
            {seg.isJackpot ? (
              <>
                <text
                  textAnchor="middle"
                  dy="-6"
                  fontSize="10"
                  fontWeight="900"
                  fill="#ffd700"
                  fontFamily="'Cinzel', serif"
                  className="drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                >
                  👑 JACKPOT
                </text>
                <text
                  textAnchor="middle"
                  dy="8"
                  fontSize="13"
                  fontWeight="900"
                  fill="#ffffff"
                  fontFamily="system-ui, sans-serif"
                  className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  ₹100
                </text>
              </>
            ) : (
              <>
                <text
                  textAnchor="middle"
                  dy="4"
                  fontSize="13"
                  fontWeight="900"
                  fill={seg.textColor || '#ffffff'}
                  fontFamily="system-ui, sans-serif"
                  className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]"
                >
                  ₹{seg.value}
                </text>
                <text
                  textAnchor="middle"
                  dy="15"
                  fontSize="8"
                  fontWeight="700"
                  fill="#cbd5e1"
                  letterSpacing="0.5"
                >
                  INR
                </text>
              </>
            )}
          </g>
        </g>
      );
    });
  };

  const hasSpunToday = spinState?.hasSpunToday ?? false;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#0b0e14] border-2 border-[#d4af37]/60 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-[0_0_60px_rgba(212,175,55,0.25)] relative overflow-hidden flex flex-col items-center text-center">
        {/* Background ambient lighting */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1.5 rounded-xl bg-gray-900/60 border border-gray-800 disabled:opacity-40 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="space-y-1 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-[#d4af37]/40 text-[#f5d061] text-[10px] font-black uppercase tracking-widest shadow-inner">
            <Sparkles className="w-3 h-3 text-[#f5d061] animate-spin" />
            <span>DAILY FREE REWARD &bull; 7 SEGMENTS</span>
          </div>

          <h2 className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-wide flex items-center justify-center gap-2">
            <span>BITYORA DAILY FREE SPIN</span>
          </h2>

          <p className="text-xs text-gray-400 max-w-sm">
            Spin once every calendar day. Exactly <strong>1 in 100 spins</strong> wins the <strong>₹100 INR Mega Jackpot</strong>!
          </p>
        </div>

        {/* WHEEL CONTAINER */}
        <div className="relative my-3 flex items-center justify-center">
          {/* Animated Outer Chassis with Chasing LED Lights */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full p-2 bg-gradient-to-b from-[#2a1e05] via-[#120e03] to-[#1e1504] border-4 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.4)] flex items-center justify-center">
            {/* Chasing Perimeter Neon Bulbs */}
            {[...Array(24)].map((_, i) => {
              const angle = (i * 360) / 24;
              const rad = (angle * Math.PI) / 180;
              const r = 138;
              const x = r * Math.cos(rad);
              const y = r * Math.sin(rad);

              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    backgroundColor: i % 2 === (isSpinning ? 1 : 0) ? '#f5d061' : '#ff4500',
                    boxShadow: i % 2 === (isSpinning ? 1 : 0)
                      ? '0 0 8px #f5d061'
                      : '0 0 8px #ff4500',
                  }}
                />
              );
            })}

            {/* Rotating SVG Wheel */}
            <div
              className="w-full h-full rounded-full overflow-hidden transition-transform ease-out"
              style={{
                transform: `rotate(${currentRotation}deg)`,
                transitionDuration: isSpinning ? '4500ms' : '0ms',
                transitionTimingFunction: 'cubic-bezier(0.12, 0.95, 0.2, 1.0)',
              }}
            >
              <svg viewBox="0 0 320 320" className="w-full h-full">
                {renderWheelSegments()}
              </svg>
            </div>

            {/* Center Decorative Golden Hub */}
            <div className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-[#ffd700] via-[#d4af37] to-[#8c6b1b] border-2 border-white shadow-[0_0_20px_rgba(255,215,0,0.8)] flex items-center justify-center z-20 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-[#120e03] border border-[#f5d061]/60 flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#f5d061]" />
              </div>
            </div>

            {/* Golden Pointer / Ticker at Top */}
            <div
              className={`absolute -top-3 left-1/2 -translate-x-1/2 z-30 transition-transform duration-75 ${
                tickerTick ? '-rotate-6 scale-110' : 'rotate-0'
              }`}
            >
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[22px] border-t-[#ffd700] filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white absolute -top-1 left-1/2 -translate-x-1/2 shadow" />
            </div>
          </div>
        </div>

        {/* WIN CELEBRATION CARD */}
        {showCelebration && winningSegment && (
          <div className="w-full my-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#f5d061]/30 to-amber-500/20 border-2 border-[#d4af37] animate-scaleUp shadow-xl">
            {winningSegment.isJackpot ? (
              <div className="space-y-1">
                <span className="text-xl">👑 🎆 👑</span>
                <p className="font-cinzel text-lg font-black text-[#ffd700] drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]">
                  CONGRATULATIONS! 100 INR MEGA JACKPOT!
                </p>
                <p className="text-xs text-white font-bold">
                  You hit the 1-in-100 milestone reward! +₹100 credited to your wallet!
                </p>
              </div>
            ) : winningSegment.value > 0 ? (
              <div>
                <p className="font-cinzel text-base font-black text-emerald-400">
                  🎉 YOU WON +₹{winningSegment.value} INR!
                </p>
                <p className="text-xs text-gray-300">
                  Daily Free Spin reward added directly to your unified wallet balance.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-cinzel text-sm font-bold text-gray-300">
                  BETTER LUCK TOMORROW!
                </p>
                <p className="text-xs text-gray-400">
                  You landed on 0 INR. Come back tomorrow for another guaranteed spin chance!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="w-full my-2 p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PROMINENT SINGLE SPIN BUTTON (STRICT 1 PER DAY ENFORCED) */}
        <div className="w-full mt-3 space-y-2">
          {!hasSpunToday ? (
            <button
              onClick={handleExecuteSingleSpin}
              disabled={isSpinning}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-[#ffd700] to-amber-500 hover:from-amber-400 hover:to-[#ffd700] text-black font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_30px_rgba(245,208,97,0.6)] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-white/60 animate-pulse"
            >
              <Zap className="w-5 h-5 text-black fill-current" />
              <span>{isSpinning ? 'SPINNING WHEEL...' : 'SINGLE SPIN — FREE TODAY'}</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                disabled
                className="w-full py-3.5 px-6 rounded-2xl bg-gray-900 border border-gray-800 text-gray-400 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SPUN TODAY &bull; 1 SPIN / DAY LIMIT ENFORCED</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-amber-300 font-mono-numbers bg-[#121622] border border-[#242c3d] py-1.5 px-3 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Next Free Spin Available in: <strong>{countdownText}</strong></span>
              </div>
            </div>
          )}

          {/* Reward values schedule footer */}
          <div className="pt-2 border-t border-[#242c3d] flex items-center justify-between text-[11px] text-gray-400">
            <span>7 Segments: 0, 1, 2, 5, 1, 15, 100 INR</span>
            <span className="text-[#f5d061] font-mono-numbers font-bold">
              Cycle: #{spinState?.globalSpinCounter ?? 1}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

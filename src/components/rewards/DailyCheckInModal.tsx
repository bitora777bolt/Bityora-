import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Sparkles,
  Gift,
  CheckCircle2,
  Lock,
  Crown,
  Flame,
  X,
  Coins,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { DAILY_REWARDS } from '../../utils/dailyCheckIn';
import { DailyCheckInState } from '../../types';
import { sounds } from '../../utils/soundEffects';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkInState: DailyCheckInState;
  onClaim: () => { success: boolean; amount: number; day: number; message: string };
  userBalance: number;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen,
  onClose,
  checkInState,
  onClaim,
  userBalance,
}) => {
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentDay = checkInState.currentDay;
  const hasClaimedToday = checkInState.hasClaimedToday;
  const currentReward = DAILY_REWARDS.find((r) => r.day === currentDay) || DAILY_REWARDS[0];

  const handleClaimReward = () => {
    if (hasClaimedToday || isClaiming) return;
    setIsClaiming(true);

    try {
      const res = onClaim();
      if (res.success) {
        sounds.cashOutWin();
        setShowConfetti(true);
        setClaimFeedback(res.message);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setClaimFeedback(res.message);
      }
    } catch (err: any) {
      setClaimFeedback(err?.message || 'Error claiming daily reward.');
    } finally {
      setIsClaiming(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-checkin-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center -z-10">
        <div className="w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/15 via-[#f5d061]/20 to-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      <div
        className="relative w-full max-w-2xl my-auto rounded-3xl border-2 border-[#d4af37]/60 bg-gradient-to-b from-[#0f1420] via-[#090d16] to-[#06080e] shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.25)] flex flex-col justify-start animate-in zoom-in-95 duration-200 p-5 sm:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration Particles Effect on Claim */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-[#f5d061]/10 animate-pulse" />
            <div className="text-center space-y-2 animate-bounce">
              <span className="text-6xl">🎉</span>
              <p className="font-cinzel text-2xl font-black text-[#f5d061] drop-shadow-[0_0_20px_rgba(245,208,97,0.8)]">
                +{currentReward.credits} CREDITS ADDED!
              </p>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#242c3d]/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-[#f5d061] text-[10px] sm:text-xs font-black uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{checkInState.streak} Day Streak Active</span>
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-gray-400">
                Cycle: Day {currentDay} of 7
              </span>
            </div>

            <h2 id="daily-checkin-title" className="font-cinzel text-xl sm:text-3xl font-black text-white tracking-wide flex items-center gap-2.5">
              <span>DAILY VIP CHECK-IN</span>
              <Sparkles className="w-5 h-5 text-[#f5d061]" />
            </h2>
            <p className="text-xs text-gray-300 max-w-md">
              Log in every day to claim incremental rewards. Reach Day 7 to unlock the peak 6-credit jackpot, after which the 7-day cycle resets!
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Balance & Streak Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
          <div className="bg-[#121724] border border-[#242c3d] rounded-2xl p-3">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Current Balance</span>
            <span className="font-mono-numbers text-lg sm:text-xl font-black text-[#f5d061]">
              ₹{userBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#121724] border border-[#242c3d] rounded-2xl p-3">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Today's Reward</span>
            <span className="font-mono-numbers text-lg sm:text-xl font-black text-emerald-400">
              +{currentReward.credits} VIP Credits
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#121724] border border-[#242c3d] rounded-2xl p-3">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Cycle Peak Bonus</span>
            <span className="font-mono-numbers text-lg sm:text-xl font-black text-amber-300 flex items-center gap-1">
              <Crown className="w-4 h-4 text-[#f5d061]" />
              <span>+6 Credits</span>
            </span>
          </div>
        </div>

        {/* 7-Day Progressive Cyclical Visual Grid */}
        <div className="space-y-2 my-2">
          <div className="flex items-center justify-between text-xs text-gray-300 font-bold px-1">
            <span>7-Day Reward Path</span>
            <span className="text-amber-400 text-[11px]">Strictly 1 Claim Per Day</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {DAILY_REWARDS.map((reward) => {
              const isPastClaimed = hasClaimedToday
                ? reward.day <= currentDay
                : reward.day < currentDay;

              const isAvailableToday = !hasClaimedToday && reward.day === currentDay;
              const isUpcoming = reward.day > currentDay;
              const isPeak = reward.isPeak;

              return (
                <div
                  key={reward.day}
                  className={`relative rounded-2xl p-3 flex flex-col items-center justify-between text-center transition-all ${
                    isAvailableToday
                      ? 'bg-gradient-to-b from-amber-500/25 via-[#f5d061]/20 to-amber-500/10 border-2 border-[#f5d061] shadow-[0_0_25px_rgba(245,208,97,0.4)] scale-105 z-10 animate-pulse'
                      : isPastClaimed
                      ? 'bg-[#0a0e17] border border-emerald-500/40 opacity-75'
                      : isPeak
                      ? 'bg-gradient-to-b from-[#1b1406] to-[#0e0c05] border-2 border-amber-400/60 shadow-[0_0_15px_rgba(245,208,97,0.2)]'
                      : 'bg-[#0c101a] border border-[#242c3d]/80'
                  }`}
                >
                  {/* Badge */}
                  <div className="w-full flex items-center justify-between text-[9px] font-black uppercase mb-1">
                    <span className={isAvailableToday ? 'text-amber-300' : isPastClaimed ? 'text-emerald-400' : 'text-gray-400'}>
                      Day {reward.day}
                    </span>
                    {isPastClaimed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isAvailableToday ? (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    ) : isPeak ? (
                      <Crown className="w-3.5 h-3.5 text-[#f5d061]" />
                    ) : (
                      <Lock className="w-3 h-3 text-gray-500" />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl my-1 flex items-center justify-center font-bold text-sm shadow ${
                      isAvailableToday
                        ? 'bg-gradient-to-br from-[#f5d061] to-amber-600 text-black shadow-[0_0_15px_rgba(245,208,97,0.6)]'
                        : isPastClaimed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isPeak
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                        : 'bg-[#151b28] text-gray-400'
                    }`}
                  >
                    {isPeak ? '👑' : isPastClaimed ? '✓' : '🎁'}
                  </div>

                  {/* Reward Credit Display */}
                  <div className="mt-1">
                    <span
                      className={`font-mono-numbers font-black text-sm block ${
                        isAvailableToday
                          ? 'text-[#f5d061]'
                          : isPastClaimed
                          ? 'text-emerald-300'
                          : isPeak
                          ? 'text-amber-300 font-extrabold'
                          : 'text-gray-300'
                      }`}
                    >
                      +{reward.credits}
                    </span>
                    <span className="text-[9px] text-gray-400 block truncate max-w-[70px]">
                      {reward.credits === 1 ? 'Credit' : 'Credits'}
                    </span>
                  </div>

                  {/* Status Indicator Pill */}
                  <div className="mt-2 w-full">
                    {isPastClaimed ? (
                      <span className="text-[8px] font-black uppercase text-emerald-400 block bg-emerald-950/60 py-0.5 rounded-md border border-emerald-500/20">
                        Claimed
                      </span>
                    ) : isAvailableToday ? (
                      <span className="text-[8px] font-black uppercase text-black block bg-[#f5d061] py-0.5 rounded-md shadow">
                        Ready!
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold text-gray-500 block">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Message */}
        {claimFeedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 mt-3 ${
              claimFeedback.includes('Claimed!') || claimFeedback.includes('added')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{claimFeedback}</span>
          </div>
        )}

        {/* Claim Action Button */}
        <div className="mt-4 pt-4 border-t border-[#242c3d]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            {hasClaimedToday ? (
              <span>
                Day {currentDay} reward already claimed. Next daily check-in unlocks in{' '}
                <strong className="text-white">~{checkInState.nextRewardInHours || 12} hours</strong>.
              </span>
            ) : (
              <span>
                Day {currentDay} reward is unlocked! Claim{' '}
                <strong className="text-[#f5d061]">+{currentReward.credits} credits</strong> now.
              </span>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            {!hasClaimedToday ? (
              <button
                type="button"
                onClick={handleClaimReward}
                disabled={isClaiming}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-[#f5d061] to-yellow-500 hover:brightness-110 active:scale-95 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(245,208,97,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" />
                <span>
                  {isClaiming ? 'Claiming...' : `Claim Day ${currentDay} Reward (+${currentReward.credits} Credits)`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#151b26] border border-[#242c3d] text-gray-400 font-bold text-xs uppercase cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Claimed for Today &bull; Return Tomorrow</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl bg-[#121724] border border-[#242c3d] text-gray-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Cyclical Reset Rule Explanation */}
        <p className="text-[10px] text-gray-500 text-center mt-3">
          7-Day Cyclical Rule: Smaller daily rewards grow from Day 1 to Day 6, peaking at +6 Credits on Day 7. Completing Day 7 resets the cycle to Day 1.
        </p>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default DailyCheckInModal;

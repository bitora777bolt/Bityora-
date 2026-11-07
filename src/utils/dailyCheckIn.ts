import { DailyCheckInReward, DailyCheckInState } from '../types';

/**
 * 7-Day Cyclical Progressive Daily Check-In Rewards Configuration
 * Day 1 to Day 6: smaller incremental amounts (1, 2, 2, 3, 3, 4)
 * Day 7: Peak reward of 6 credits
 * After Day 7, the cycle smoothly resets back to Day 1.
 */
export const DAILY_REWARDS: DailyCheckInReward[] = [
  {
    day: 1,
    credits: 1,
    title: 'Starter Blessing',
    badge: 'Day 1',
  },
  {
    day: 2,
    credits: 2,
    title: 'Streak Ignition',
    badge: 'Day 2',
  },
  {
    day: 3,
    credits: 2,
    title: 'Silver Vault',
    badge: 'Day 3',
  },
  {
    day: 4,
    credits: 3,
    title: 'Golden Rush',
    badge: 'Day 4',
  },
  {
    day: 5,
    credits: 3,
    title: 'VIP Momentum',
    badge: 'Day 5',
  },
  {
    day: 6,
    credits: 4,
    title: 'High Roller Surge',
    badge: 'Day 6',
  },
  {
    day: 7,
    credits: 6,
    title: 'Grand Jackpot Peak',
    badge: '🔥 PEAK REWARD',
    isPeak: true,
  },
];

/**
 * Returns formatted YYYY-MM-DD for current local time
 */
export const getTodayDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns formatted YYYY-MM-DD for yesterday local time
 */
export const getYesterdayDateKey = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates remaining hours until midnight local time (next daily reward)
 */
export const getHoursUntilMidnight = (): number => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
};

/**
 * Retrieves the current 7-day cyclical check-in state for a user
 */
export const getDailyCheckInState = (userId: string): DailyCheckInState => {
  if (!userId) {
    return {
      currentDay: 1,
      lastClaimDate: null,
      streak: 0,
      totalClaimedCredits: 0,
      hasClaimedToday: false,
      nextRewardInHours: getHoursUntilMidnight(),
    };
  }

  const today = getTodayDateKey();
  const yesterday = getYesterdayDateKey();

  try {
    const raw = localStorage.getItem(`bitora_checkin_${userId}`);
    if (!raw) {
      return {
        currentDay: 1,
        lastClaimDate: null,
        streak: 0,
        totalClaimedCredits: 0,
        hasClaimedToday: false,
        nextRewardInHours: getHoursUntilMidnight(),
      };
    }

    const stored = JSON.parse(raw);
    const lastDate = stored.lastClaimDate || null;
    const streak = typeof stored.streak === 'number' ? stored.streak : 0;
    const totalClaimed = typeof stored.totalClaimedCredits === 'number' ? stored.totalClaimedCredits : 0;
    const storedDay = typeof stored.currentDay === 'number' ? stored.currentDay : 1;

    // 1. Claimed Today already
    if (lastDate === today) {
      return {
        currentDay: storedDay,
        lastClaimDate: today,
        streak,
        totalClaimedCredits: totalClaimed,
        hasClaimedToday: true,
        nextRewardInHours: getHoursUntilMidnight(),
      };
    }

    // 2. Claimed Yesterday (consecutive streak continues!)
    if (lastDate === yesterday) {
      // If yesterday was Day 7, cycle resets to Day 1. Otherwise advances to storedDay + 1
      const nextDay = storedDay >= 7 ? 1 : storedDay + 1;
      return {
        currentDay: nextDay,
        lastClaimDate: lastDate,
        streak,
        totalClaimedCredits: totalClaimed,
        hasClaimedToday: false,
        nextRewardInHours: 0,
      };
    }

    // 3. Streak lapsed (missed yesterday or older) -> Reset cyclical progress to Day 1
    return {
      currentDay: 1,
      lastClaimDate: lastDate,
      streak: 0, // Reset streak counter
      totalClaimedCredits: totalClaimed,
      hasClaimedToday: false,
      nextRewardInHours: 0,
    };
  } catch (err) {
    console.warn('Daily check-in parse note:', err);
    return {
      currentDay: 1,
      lastClaimDate: null,
      streak: 0,
      totalClaimedCredits: 0,
      hasClaimedToday: false,
      nextRewardInHours: getHoursUntilMidnight(),
    };
  }
};

/**
 * Claims today's reward for the user in the 7-day cyclical system
 */
export const claimDailyCheckInReward = (
  userId: string
): { success: boolean; state: DailyCheckInState; reward: DailyCheckInReward; message: string } => {
  const currentState = getDailyCheckInState(userId);
  const today = getTodayDateKey();

  // Strict restriction: 1 claim per user per day
  if (currentState.hasClaimedToday) {
    const claimedReward = DAILY_REWARDS.find((r) => r.day === currentState.currentDay) || DAILY_REWARDS[0];
    const nextDay = currentState.currentDay >= 7 ? 1 : currentState.currentDay + 1;
    const nextReward = DAILY_REWARDS.find((r) => r.day === nextDay) || DAILY_REWARDS[0];
    return {
      success: false,
      state: currentState,
      reward: claimedReward,
      message: `You have already claimed today's Day ${currentState.currentDay} reward (${claimedReward.credits} credits). Day ${nextDay} reward (+${nextReward.credits} credits) unlocks tomorrow!`,
    };
  }

  const reward = DAILY_REWARDS.find((r) => r.day === currentState.currentDay) || DAILY_REWARDS[0];
  const newStreak = currentState.streak + 1;
  const newTotalCredits = currentState.totalClaimedCredits + reward.credits;

  const newState: DailyCheckInState = {
    currentDay: currentState.currentDay,
    lastClaimDate: today,
    streak: newStreak,
    totalClaimedCredits: newTotalCredits,
    hasClaimedToday: true,
    nextRewardInHours: getHoursUntilMidnight(),
  };

  try {
    localStorage.setItem(`bitora_checkin_${userId}`, JSON.stringify(newState));
  } catch (err) {
    console.warn('Storage save checkin note:', err);
  }

  return {
    success: true,
    state: newState,
    reward,
    message: `🎉 Day ${reward.day} Daily Reward Claimed! +${reward.credits} VIP Credits added to your unified wallet!`,
  };
};

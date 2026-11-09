import { DailySpinSegment, DailySpinState } from '../types';

export const DAILY_SPIN_SEGMENTS: DailySpinSegment[] = [
  {
    id: 0,
    label: '0 INR',
    value: 0,
    color: '#334155',
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    textColor: '#94a3b8',
    accentColor: '#64748b',
  },
  {
    id: 1,
    label: '1 INR',
    value: 1,
    color: '#059669',
    gradient: 'from-emerald-600 via-emerald-700 to-emerald-900',
    textColor: '#a7f3d0',
    accentColor: '#34d399',
  },
  {
    id: 2,
    label: '2 INR',
    value: 2,
    color: '#0284c7',
    gradient: 'from-sky-600 via-sky-700 to-sky-900',
    textColor: '#bae6fd',
    accentColor: '#38bdf8',
  },
  {
    id: 3,
    label: '5 INR',
    value: 5,
    color: '#7c3aed',
    gradient: 'from-purple-600 via-purple-700 to-purple-900',
    textColor: '#e9d5ff',
    accentColor: '#c084fc',
  },
  {
    id: 4,
    label: '1 INR',
    value: 1,
    color: '#0d9488',
    gradient: 'from-teal-600 via-teal-700 to-teal-900',
    textColor: '#99f6e4',
    accentColor: '#2dd4bf',
  },
  {
    id: 5,
    label: '15 INR',
    value: 15,
    color: '#d97706',
    gradient: 'from-amber-600 via-amber-700 to-amber-900',
    textColor: '#fde68a',
    accentColor: '#f59e0b',
  },
  {
    id: 6,
    label: '100 INR',
    value: 100,
    color: '#dc2626',
    gradient: 'from-red-600 via-amber-500 to-yellow-400',
    isJackpot: true,
    textColor: '#ffffff',
    accentColor: '#fbbf24',
  },
];

const TOTAL_SEGMENTS = DAILY_SPIN_SEGMENTS.length; // 7 segments
export const SEGMENT_ANGLE = 360 / TOTAL_SEGMENTS; // ~51.428 degrees per segment

const GLOBAL_SPIN_COUNTER_KEY = 'bitora_global_spin_count_v2';
const USER_SPIN_PREFIX = 'bitora_user_spin_';

export const getTodayDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getSecondsUntilMidnight = (): number => {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
};

export const getFormattedCountdown = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Retrieves the global spin counter across the player base.
 * Defaults to 93 on a fresh install to quickly demonstrate the 100th spin jackpot cycle.
 */
export const getGlobalSpinCount = (): number => {
  try {
    const saved = localStorage.getItem(GLOBAL_SPIN_COUNTER_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      return isNaN(parsed) ? 93 : parsed;
    }
  } catch {}
  return 93; // Starts at 93 so players can readily experience the 100th jackpot cycle milestone
};

export const setGlobalSpinCount = (count: number) => {
  try {
    localStorage.setItem(GLOBAL_SPIN_COUNTER_KEY, String(count));
  } catch {}
};

/**
 * Retrieves user daily spin state
 */
export const getUserDailySpinState = (userId: string): DailySpinState => {
  const today = getTodayDateKey();
  let lastSpinDate: string | null = null;
  let totalSpinsCount = 0;
  let lastWonAmount: number | null = null;

  try {
    const raw = localStorage.getItem(`${USER_SPIN_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      lastSpinDate = parsed.lastSpinDate || null;
      totalSpinsCount = parsed.totalSpinsCount || 0;
      lastWonAmount = typeof parsed.lastWonAmount === 'number' ? parsed.lastWonAmount : null;
    }
  } catch {}

  const hasSpunToday = lastSpinDate === today;
  const globalSpinCounter = (getGlobalSpinCount() % 100) || 100;
  const secondsUntilNextSpin = getSecondsUntilMidnight();

  return {
    hasSpunToday,
    lastSpinDate,
    totalSpinsCount,
    globalSpinCounter,
    lastWonAmount,
    secondsUntilNextSpin,
  };
};

/**
 * Probability Logic:
 * The 100 INR jackpot is awarded to EXACTLY one out of every 100 spins across the player base.
 * Spins 1 to 99 are strictly restricted to smaller amounts (0, 1, 2, 5, 15 INR).
 * Spin 100 deterministically awards the 100 INR Mega Jackpot.
 */
export const determineDailySpinOutcome = (
  userId: string
): {
  success: boolean;
  message?: string;
  segment?: DailySpinSegment;
  targetAngle?: number;
  isJackpot?: boolean;
  globalCount?: number;
} => {
  const today = getTodayDateKey();
  const state = getUserDailySpinState(userId);

  if (state.hasSpunToday) {
    return {
      success: false,
      message: 'You have already claimed your daily free spin today! Come back tomorrow after midnight.',
    };
  }

  // Increment global spin counter
  const currentGlobal = getGlobalSpinCount();
  const nextGlobal = currentGlobal + 1;
  setGlobalSpinCount(nextGlobal);

  const cyclePosition = ((nextGlobal - 1) % 100) + 1; // 1 to 100

  let winningSegment: DailySpinSegment;
  let isJackpot = false;

  if (cyclePosition === 100) {
    // 100th spin across the player base hits the 100 INR Jackpot!
    winningSegment = DAILY_SPIN_SEGMENTS[6]; // 100 INR
    isJackpot = true;
  } else {
    // Spins 1 to 99 are guaranteed to receive smaller amounts (0, 1, 2, 5, 15 INR)
    // Weighted distribution across the remaining 6 segments:
    // Segments: 0 (0 INR), 1 (1 INR), 2 (2 INR), 3 (5 INR), 4 (1 INR), 5 (15 INR)
    const rand = Math.random() * 100;
    if (rand < 10) {
      winningSegment = DAILY_SPIN_SEGMENTS[0]; // 0 INR (~10%)
    } else if (rand < 40) {
      winningSegment = DAILY_SPIN_SEGMENTS[1]; // 1 INR (~30%)
    } else if (rand < 65) {
      winningSegment = DAILY_SPIN_SEGMENTS[2]; // 2 INR (~25%)
    } else if (rand < 82) {
      winningSegment = DAILY_SPIN_SEGMENTS[4]; // 1 INR (~17%)
    } else if (rand < 95) {
      winningSegment = DAILY_SPIN_SEGMENTS[3]; // 5 INR (~13%)
    } else {
      winningSegment = DAILY_SPIN_SEGMENTS[5]; // 15 INR (~5%)
    }
  }

  // Calculate wheel stop angle:
  // Wheel pointer is at top (270 deg or 0 deg depending on orientation).
  // With 7 segments: Segment id `i` spans [i * SEGMENT_ANGLE, (i + 1) * SEGMENT_ANGLE].
  // Center of segment is (i + 0.5) * SEGMENT_ANGLE.
  // Add 5 full rotations (1800 deg) + offset to align segment center with top pointer (270 deg).
  const segmentCenter = (winningSegment.id + 0.5) * SEGMENT_ANGLE;
  // Rotation required to bring this segment under the top pointer:
  // Pointer is at 270 degrees in SVG coordinates.
  const baseTarget = (360 - segmentCenter + 270) % 360;
  const fullRotations = 5 * 360; // 5 full revolutions for suspense
  // Add a slight micro-jitter inside segment (+/- 10 degrees) so it does not land at the exact same pixel
  const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.4);
  const targetAngle = fullRotations + baseTarget + jitter;

  // Save user spin state
  try {
    localStorage.setItem(
      `${USER_SPIN_PREFIX}${userId}`,
      JSON.stringify({
        lastSpinDate: today,
        totalSpinsCount: state.totalSpinsCount + 1,
        lastWonAmount: winningSegment.value,
      })
    );
  } catch {}

  return {
    success: true,
    segment: winningSegment,
    targetAngle,
    isJackpot,
    globalCount: cyclePosition,
  };
};

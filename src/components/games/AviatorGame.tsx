import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/soundEffects';
import {
  TrendingUp,
  DollarSign,
  History,
  Play,
  Minus,
  Plus,
  ShieldCheck,
  Zap,
  Flame,
  Crown,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  X,
  ArrowUpRight,
  RefreshCw,
  Eye,
  Sliders,
  ChevronDown,
  Trophy,
  BarChart3,
} from 'lucide-react';
import { GameScoreboard } from '../common/GameScoreboard';

export interface PlayerRoundCashout {
  playerName: string;
  avatar: string;
  betAmount: number;
  cashedOutAt: number | null; // null if crashed
  wonAmount: number;
  isUser?: boolean;
}

export interface AviatorHistoryItem {
  id: string;
  multiplier: number;
  timestamp: number;
  formattedDate: string;
  formattedTime: string; // includes seconds! e.g. "05:22:14 PM"
  roundHash: string;
  totalPlayers: number;
  totalBet: number;
  totalPayout: number;
  isMega: boolean;
  playerCashouts: PlayerRoundCashout[];
}

interface SimulatedLivePlayer {
  id: string;
  name: string;
  avatar: string;
  betAmount: number;
  targetCashout: number; // multiplier at which player exits
  cashedOut: boolean;
}

// Simulated player pool for high-fidelity community atmosphere
const SIMULATED_PLAYERS_POOL = [
  { name: 'Aarav_VIP', avatar: '👑' },
  { name: 'Karan_007', avatar: '🚀' },
  { name: 'Simran_K', avatar: '💎' },
  { name: 'Vikram_R', avatar: '🔥' },
  { name: 'Pooja_88', avatar: '✨' },
  { name: 'Rahul_Gold', avatar: '⚡' },
  { name: 'Dev_Mumbai', avatar: '🎰' },
  { name: 'Ananya_S', avatar: '🌟' },
  { name: 'Rohan_Crypto', avatar: '🪙' },
  { name: 'Neha_Sharma', avatar: '🎯' },
  { name: 'Arjun_Pro', avatar: '🛡️' },
  { name: 'Aditi_Royal', avatar: '🌹' },
  { name: 'Siddharth_M', avatar: '🦁' },
  { name: 'Priya_K', avatar: '💫' },
];

const generateProvablyFairHash = () => {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

const formatTimeWithSeconds = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const formatDateFull = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const QUICK_BETS = [20, 50, 100, 200, 500, 1000];

export const AviatorGame: React.FC = () => {
  const { currentUser, recordGameRound } = useGame();

  // =========================================================================
  // DUAL BETTING TERMINAL STATE (Terminal 1 & Terminal 2)
  // =========================================================================
  // Terminal 1:
  const [wager1, setWager1] = useState<number>(100);
  const [tab1, setTab1] = useState<'BET' | 'AUTO'>('BET');
  const [userStagedNextRound1, setUserStagedNextRound1] = useState<boolean>(false);
  const [hasBetInCurrentFlight1, setHasBetInCurrentFlight1] = useState<boolean>(false);
  const [currentRoundWager1, setCurrentRoundWager1] = useState<number>(100);
  const [cashedOutAt1, setCashedOutAt1] = useState<number | null>(null);
  const [autoCashoutEnabled1, setAutoCashoutEnabled1] = useState<boolean>(false);
  const [autoCashoutAt1, setAutoCashoutAt1] = useState<number>(2.0);
  const [autoBetEnabled1, setAutoBetEnabled1] = useState<boolean>(false);

  // Terminal 2:
  const [wager2, setWager2] = useState<number>(100);
  const [tab2, setTab2] = useState<'BET' | 'AUTO'>('BET');
  const [userStagedNextRound2, setUserStagedNextRound2] = useState<boolean>(false);
  const [hasBetInCurrentFlight2, setHasBetInCurrentFlight2] = useState<boolean>(false);
  const [currentRoundWager2, setCurrentRoundWager2] = useState<number>(100);
  const [cashedOutAt2, setCashedOutAt2] = useState<number | null>(null);
  const [autoCashoutEnabled2, setAutoCashoutEnabled2] = useState<boolean>(false);
  const [autoCashoutAt2, setAutoCashoutAt2] = useState<number>(2.0);
  const [autoBetEnabled2, setAutoBetEnabled2] = useState<boolean>(false);

  // Flight cycle states
  const [flightState, setFlightState] = useState<'WAITING' | 'FLYING' | 'CRASHED'>('WAITING');
  const [waitingCountdown, setWaitingCountdown] = useState<number>(5.0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(1.0);
  const [isMegaFlight, setIsMegaFlight] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Next flight preparing. Place your bets!');

  // Live Community Bets sidebar state
  const [liveBetsTab, setLiveBetsTab] = useState<'ALL' | 'MY_BETS' | 'TOP'>('ALL');
  const [currentLiveBets, setCurrentLiveBets] = useState<SimulatedLivePlayer[]>([]);
  const [userBetHistory, setUserBetHistory] = useState<
    { id: string; bet: number; multiplier: number | null; won: number; time: string }[]
  >([]);
  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);

  // Detailed Modal Inspection
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AviatorHistoryItem | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'CASHED_OUT' | 'CRASHED'>('ALL');

  // Live player betting statistics calculated in real-time
  const liveStats = useMemo(() => {
    let totalBets = currentLiveBets.length;
    let totalStaked = currentLiveBets.reduce((sum, b) => sum + b.betAmount, 0);
    let totalWon = 0;
    let cashedOutCount = 0;
    let topMultiplier = 1.0;

    currentLiveBets.forEach(b => {
      if (b.cashedOut) {
        cashedOutCount++;
        totalWon += Math.round(b.betAmount * b.targetCashout);
        if (b.targetCashout > topMultiplier) {
          topMultiplier = b.targetCashout;
        }
      }
    });

    if (hasBetInCurrentFlight1) {
      totalBets += 1;
      totalStaked += currentRoundWager1;
      if (cashedOutAt1 !== null) {
        cashedOutCount++;
        totalWon += Math.round(currentRoundWager1 * cashedOutAt1);
        if (cashedOutAt1 > topMultiplier) topMultiplier = cashedOutAt1;
      }
    }

    if (hasBetInCurrentFlight2) {
      totalBets += 1;
      totalStaked += currentRoundWager2;
      if (cashedOutAt2 !== null) {
        cashedOutCount++;
        totalWon += Math.round(currentRoundWager2 * cashedOutAt2);
        if (cashedOutAt2 > topMultiplier) topMultiplier = cashedOutAt2;
      }
    }

    const cashoutRate = totalBets > 0 ? Math.round((cashedOutCount / totalBets) * 100) : 0;

    return {
      totalBets,
      totalStaked,
      totalWon,
      cashedOutCount,
      cashoutRate,
      topMultiplier,
    };
  }, [
    currentLiveBets,
    hasBetInCurrentFlight1,
    hasBetInCurrentFlight2,
    cashedOutAt1,
    cashedOutAt2,
    currentRoundWager1,
    currentRoundWager2,
  ]);

  // Multiplier history badges
  const [historyRecords, setHistoryRecords] = useState<AviatorHistoryItem[]>(() => {
    const seedMultipliers = [
      2.45, 1.85, 3.2, 1.15, 2.1, 8.5, 1.45, 24.5, 1.05, 1.95, 3.1, 1.35, 150.0, 2.8, 1.62, 1000.0,
    ];
    const now = Date.now();

    return seedMultipliers.map((mult, idx) => {
      const pastTime = new Date(now - (idx + 1) * 75 * 1000);
      const isMega = mult >= 100;
      const numPlayers = Math.floor(Math.random() * 6) + 8;
      const playerList: PlayerRoundCashout[] = [];
      let totalBetAmt = 0;
      let totalWonAmt = 0;

      for (let p = 0; p < numPlayers; p++) {
        const playerProfile = SIMULATED_PLAYERS_POOL[p % SIMULATED_PLAYERS_POOL.length];
        const pBet = [50, 100, 200, 300, 500, 1000][Math.floor(Math.random() * 6)];
        totalBetAmt += pBet;

        const pTarget = Number((1.1 + Math.random() * (mult * 1.25)).toFixed(2));
        if (pTarget <= mult) {
          const won = Math.round(pBet * pTarget);
          totalWonAmt += won;
          playerList.push({
            playerName: playerProfile.name,
            avatar: playerProfile.avatar,
            betAmount: pBet,
            cashedOutAt: pTarget,
            wonAmount: won,
          });
        } else {
          playerList.push({
            playerName: playerProfile.name,
            avatar: playerProfile.avatar,
            betAmount: pBet,
            cashedOutAt: null,
            wonAmount: 0,
          });
        }
      }

      return {
        id: `AV-${89400 - idx}`,
        multiplier: mult,
        timestamp: pastTime.getTime(),
        formattedDate: formatDateFull(pastTime),
        formattedTime: formatTimeWithSeconds(pastTime),
        roundHash: generateProvablyFairHash(),
        totalPlayers: numPlayers,
        totalBet: totalBetAmt,
        totalPayout: totalWonAmt,
        isMega,
        playerCashouts: playerList,
      };
    });
  });

  // Animation & Loop refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const propellerAngleRef = useRef<number>(0);

  // Synchronization refs for Terminal 1
  const cashedOutAtRef1 = useRef<number | null>(null);
  cashedOutAtRef1.current = cashedOutAt1;
  const userStagedNextRoundRef1 = useRef<boolean>(userStagedNextRound1);
  userStagedNextRoundRef1.current = userStagedNextRound1;
  const autoBetEnabledRef1 = useRef<boolean>(autoBetEnabled1);
  autoBetEnabledRef1.current = autoBetEnabled1;
  const wagerRef1 = useRef<number>(wager1);
  wagerRef1.current = wager1;
  const autoCashoutEnabledRef1 = useRef<boolean>(autoCashoutEnabled1);
  autoCashoutEnabledRef1.current = autoCashoutEnabled1;
  const autoCashoutAtRef1 = useRef<number>(autoCashoutAt1);
  autoCashoutAtRef1.current = autoCashoutAt1;
  const hasBetInFlightRef1 = useRef<boolean>(hasBetInCurrentFlight1);
  hasBetInFlightRef1.current = hasBetInCurrentFlight1;

  // Synchronization refs for Terminal 2
  const cashedOutAtRef2 = useRef<number | null>(null);
  cashedOutAtRef2.current = cashedOutAt2;
  const userStagedNextRoundRef2 = useRef<boolean>(userStagedNextRound2);
  userStagedNextRoundRef2.current = userStagedNextRound2;
  const autoBetEnabledRef2 = useRef<boolean>(autoBetEnabled2);
  autoBetEnabledRef2.current = autoBetEnabled2;
  const wagerRef2 = useRef<number>(wager2);
  wagerRef2.current = wager2;
  const autoCashoutEnabledRef2 = useRef<boolean>(autoCashoutEnabled2);
  autoCashoutEnabledRef2.current = autoCashoutEnabled2;
  const autoCashoutAtRef2 = useRef<number>(autoCashoutAt2);
  autoCashoutAtRef2.current = autoCashoutAt2;
  const hasBetInFlightRef2 = useRef<boolean>(hasBetInCurrentFlight2);
  hasBetInFlightRef2.current = hasBetInCurrentFlight2;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  // Mega jackpot gap timer (5 - 20 mins)
  const getNextMegaJackpotGapMs = () => {
    const minMs = 5 * 60 * 1000;
    const maxMs = 20 * 60 * 1000;
    return minMs + Math.random() * (maxMs - minMs);
  };

  const lastMegaJackpotTimeRef = useRef<number>((() => {
    try {
      const saved = localStorage.getItem('bitora_aviator_last_mega_jackpot');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && Date.now() - parsed < 25 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {
      // storage failsafe
    }
    return Date.now() - 7 * 60 * 1000;
  })());

  const nextMegaGapMsRef = useRef<number>(getNextMegaJackpotGapMs());

  // Generate realistic crash multiplier
  const generateAutonomousCrashPoint = (): { point: number; isMega: boolean } => {
    const now = Date.now();
    const elapsedSinceMega = now - lastMegaJackpotTimeRef.current;
    const requiredMegaGap = nextMegaGapMsRef.current;

    if (elapsedSinceMega >= requiredMegaGap) {
      lastMegaJackpotTimeRef.current = now;
      try {
        localStorage.setItem('bitora_aviator_last_mega_jackpot', String(now));
      } catch {
        // ignore
      }
      nextMegaGapMsRef.current = getNextMegaJackpotGapMs();

      const roll = Math.random();
      let pt = 100.0;
      if (roll < 0.35) {
        pt = Number((120.0 + Math.random() * 180.0).toFixed(2));
      } else if (roll < 0.7) {
        pt = Number((301.0 + Math.random() * 399.0).toFixed(2));
      } else {
        pt = Number((701.0 + Math.random() * 299.0).toFixed(2));
      }
      return { point: pt, isMega: true };
    }

    const roll = Math.random();
    let pt = 1.0;

    if (roll < 0.16) {
      // Sudden early flyaway
      pt = Number((1.0 + Math.random() * 0.18).toFixed(2));
    } else if (roll < 0.54) {
      // Fast crash right before 2x
      pt = Number((1.19 + Math.random() * 0.76).toFixed(2));
    } else if (roll < 0.82) {
      // Moderate climb
      pt = Number((2.0 + Math.random() * 2.2).toFixed(2));
    } else if (roll < 0.94) {
      // High altitude
      pt = Number((4.21 + Math.random() * 7.79).toFixed(2));
    } else if (roll < 0.985) {
      // Sky rocket
      pt = Number((12.01 + Math.random() * 32.99).toFixed(2));
    } else {
      // Super spike
      pt = Number((45.01 + Math.random() * 54.98).toFixed(2));
    }

    return { point: Math.max(1.0, pt), isMega: false };
  };

  // Helper to generate simulated live bets for the current flight
  const generateLiveCommunityBets = (crashMultiplier: number) => {
    const count = Math.floor(Math.random() * 8) + 12;
    const bets: SimulatedLivePlayer[] = [];
    for (let i = 0; i < count; i++) {
      const p = SIMULATED_PLAYERS_POOL[i % SIMULATED_PLAYERS_POOL.length];
      const betAmt = [20, 50, 100, 200, 300, 500, 1000][Math.floor(Math.random() * 7)];
      const target = Number((1.12 + Math.random() * (crashMultiplier * 1.35)).toFixed(2));
      bets.push({
        id: `LB-${i}-${Date.now()}`,
        name: p.name,
        avatar: p.avatar,
        betAmount: betAmt,
        targetCashout: target,
        cashedOut: false,
      });
    }
    return bets;
  };

  // =========================================================================
  // AUTONOMOUS GAME CYCLE 1: WAITING COUNTDOWN LOOP
  // =========================================================================
  useEffect(() => {
    if (flightState !== 'WAITING') return;

    let timeLeft = 5.0;
    setWaitingCountdown(5.0);
    setCurrentMultiplier(1.0);
    setCashedOutAt1(null);
    setCashedOutAt2(null);
    cashedOutAtRef1.current = null;
    cashedOutAtRef2.current = null;
    setStatusMessage('Next flight preparing. Place your bets!');

    const interval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 0.1);
      setWaitingCountdown(Number(timeLeft.toFixed(1)));

      if (timeLeft <= 0) {
        clearInterval(interval);

        const { point, isMega } = generateAutonomousCrashPoint();
        setCrashPoint(point);
        setIsMegaFlight(isMega);

        // Generate community live bets
        const liveBets = generateLiveCommunityBets(point);
        setCurrentLiveBets(liveBets);

        let currentBal = currentUserRef.current?.balance || 0;

        // Process Terminal 1 bet staging
        const willBet1 = userStagedNextRoundRef1.current || autoBetEnabledRef1.current;
        const betAmt1 = wagerRef1.current;
        if (willBet1 && currentBal >= betAmt1) {
          setHasBetInCurrentFlight1(true);
          setCurrentRoundWager1(betAmt1);
          setUserStagedNextRound1(false);
          currentBal -= betAmt1;
        } else {
          setHasBetInCurrentFlight1(false);
          setUserStagedNextRound1(false);
        }

        // Process Terminal 2 bet staging
        const willBet2 = userStagedNextRoundRef2.current || autoBetEnabledRef2.current;
        const betAmt2 = wagerRef2.current;
        if (willBet2 && currentBal >= betAmt2) {
          setHasBetInCurrentFlight2(true);
          setCurrentRoundWager2(betAmt2);
          setUserStagedNextRound2(false);
        } else {
          setHasBetInCurrentFlight2(false);
          setUserStagedNextRound2(false);
        }

        setFlightState('FLYING');
        sounds.planeAscend();
        setStatusMessage(
          isMega
            ? '⚡ 1000x MEGA JACKPOT FLIGHT AIRBORNE! Historic altitude!'
            : 'Original Red Monoplane airborne! Flying autonomously.'
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, [flightState]);

  // =========================================================================
  // AUTONOMOUS GAME CYCLE 2: FLIGHT SIMULATION LOOP (60FPS RAF)
  // =========================================================================
  useEffect(() => {
    if (flightState !== 'FLYING') return;

    let isRunning = true;
    const targetCrash = crashPoint;
    startTimeRef.current = Date.now();

    const tick = () => {
      if (!isRunning) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      // Authentic exponential Spribe Aviator curve
      let currentVal = 1.0;
      if (elapsed <= 5) {
        currentVal = 1.0 + elapsed * 0.22;
      } else if (elapsed <= 12) {
        currentVal = 2.1 + Math.pow(elapsed - 5, 1.35) * 0.95;
      } else if (elapsed <= 22) {
        currentVal = 8.5 + Math.pow(elapsed - 12, 1.7) * 2.4;
      } else if (elapsed <= 35) {
        currentVal = 48.0 + Math.pow(elapsed - 22, 2.1) * 8.5;
      } else {
        currentVal = 240.0 + Math.pow(elapsed - 35, 2.5) * 22.0;
      }

      const simulatedMult = Number(Math.min(targetCrash, currentVal).toFixed(2));
      setCurrentMultiplier(simulatedMult);

      // Check Auto-Cashout for Terminal 1
      if (
        hasBetInFlightRef1.current &&
        cashedOutAtRef1.current === null &&
        autoCashoutEnabledRef1.current &&
        simulatedMult >= autoCashoutAtRef1.current
      ) {
        handleCashOut(1, autoCashoutAtRef1.current);
      }

      // Check Auto-Cashout for Terminal 2
      if (
        hasBetInFlightRef2.current &&
        cashedOutAtRef2.current === null &&
        autoCashoutEnabledRef2.current &&
        simulatedMult >= autoCashoutAtRef2.current
      ) {
        handleCashOut(2, autoCashoutAtRef2.current);
      }

      // Update simulated live community players in real time
      setCurrentLiveBets(prev =>
        prev.map(p => {
          if (!p.cashedOut && simulatedMult >= p.targetCashout && p.targetCashout <= targetCrash) {
            return { ...p, cashedOut: true };
          }
          return p;
        })
      );

      // Check Crash Condition
      if (simulatedMult >= targetCrash) {
        setCurrentMultiplier(targetCrash);
        setFlightState('CRASHED');
        sounds.mineExplode();
        setStatusMessage(
          targetCrash >= 100
            ? `👑 MEGA JACKPOT FLEW AWAY @ ${targetCrash.toFixed(2)}x!`
            : `FLEW AWAY @ ${targetCrash.toFixed(2)}x! The plane flew away.`
        );

        const now = new Date();
        const roundId = `AV-${Math.floor(89500 + Math.random() * 500)}`;

        // Check user losses on crash
        if (hasBetInFlightRef1.current && cashedOutAtRef1.current === null) {
          recordGameRound(
            'AVIATOR',
            'Aviator Red Monoplane (Bet 1)',
            wagerRef1.current,
            0,
            0,
            `Flew away at ${targetCrash.toFixed(2)}x`
          );
          setUserBetHistory(prev => [
            {
              id: roundId,
              bet: wagerRef1.current,
              multiplier: null,
              won: 0,
              time: formatTimeWithSeconds(now),
            },
            ...prev.slice(0, 20),
          ]);
        }

        if (hasBetInFlightRef2.current && cashedOutAtRef2.current === null) {
          recordGameRound(
            'AVIATOR',
            'Aviator Red Monoplane (Bet 2)',
            wagerRef2.current,
            0,
            0,
            `Flew away at ${targetCrash.toFixed(2)}x`
          );
          setUserBetHistory(prev => [
            {
              id: roundId,
              bet: wagerRef2.current,
              multiplier: null,
              won: 0,
              time: formatTimeWithSeconds(now),
            },
            ...prev.slice(0, 20),
          ]);
        }

        // Build player cashout records for history
        const playerList: PlayerRoundCashout[] = [];
        let totalBetAmt = 0;
        let totalWonAmt = 0;

        // Terminal 1 participation
        if (hasBetInFlightRef1.current) {
          const w = wagerRef1.current;
          totalBetAmt += w;
          const userWon1 = cashedOutAtRef1.current
            ? Math.round(w * cashedOutAtRef1.current)
            : 0;
          totalWonAmt += userWon1;
          playerList.push({
            playerName: `${currentUserRef.current?.username || 'You'} (Bet 1)`,
            avatar: '⭐',
            betAmount: w,
            cashedOutAt: cashedOutAtRef1.current,
            wonAmount: userWon1,
            isUser: true,
          });
        }

        // Terminal 2 participation
        if (hasBetInFlightRef2.current) {
          const w = wagerRef2.current;
          totalBetAmt += w;
          const userWon2 = cashedOutAtRef2.current
            ? Math.round(w * cashedOutAtRef2.current)
            : 0;
          totalWonAmt += userWon2;
          playerList.push({
            playerName: `${currentUserRef.current?.username || 'You'} (Bet 2)`,
            avatar: '⭐',
            betAmount: w,
            cashedOutAt: cashedOutAtRef2.current,
            wonAmount: userWon2,
            isUser: true,
          });
        }

        // Simulated players
        const numSim = Math.floor(Math.random() * 6) + 8;
        for (let p = 0; p < numSim; p++) {
          const profile = SIMULATED_PLAYERS_POOL[p % SIMULATED_PLAYERS_POOL.length];
          const pBet = [50, 100, 200, 300, 500, 1000][Math.floor(Math.random() * 6)];
          totalBetAmt += pBet;

          const pTarget = Number((1.1 + Math.random() * (targetCrash * 1.3)).toFixed(2));
          if (pTarget <= targetCrash) {
            const won = Math.round(pBet * pTarget);
            totalWonAmt += won;
            playerList.push({
              playerName: profile.name,
              avatar: profile.avatar,
              betAmount: pBet,
              cashedOutAt: pTarget,
              wonAmount: won,
            });
          } else {
            playerList.push({
              playerName: profile.name,
              avatar: profile.avatar,
              betAmount: pBet,
              cashedOutAt: null,
              wonAmount: 0,
            });
          }
        }

        const newRecord: AviatorHistoryItem = {
          id: roundId,
          multiplier: targetCrash,
          timestamp: now.getTime(),
          formattedDate: formatDateFull(now),
          formattedTime: formatTimeWithSeconds(now),
          roundHash: generateProvablyFairHash(),
          totalPlayers: playerList.length,
          totalBet: totalBetAmt,
          totalPayout: totalWonAmt,
          isMega: targetCrash >= 100,
          playerCashouts: playerList,
        };

        setHistoryRecords(prev => [newRecord, ...prev.slice(0, 30)]);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [flightState, crashPoint]);

  // Hold in CRASHED state for 2.6 seconds, then automatically cycle to WAITING
  useEffect(() => {
    if (flightState !== 'CRASHED') return;
    const holdTimer = setTimeout(() => {
      setFlightState('WAITING');
    }, 2600);
    return () => clearTimeout(holdTimer);
  }, [flightState]);

  // =========================================================================
  // DUAL CASH OUT HANDLERS
  // =========================================================================
  const handleCashOut = (terminalIndex: 1 | 2, multOverride?: number) => {
    if (flightState !== 'FLYING') return;

    const winMultiplier = multOverride || currentMultiplier;

    if (terminalIndex === 1) {
      if (!hasBetInCurrentFlight1 || cashedOutAtRef1.current !== null) return;
      const payout = Number((currentRoundWager1 * winMultiplier).toFixed(2));
      cashedOutAtRef1.current = winMultiplier;
      setCashedOutAt1(winMultiplier);
      sounds.cashOutWin();

      recordGameRound(
        'AVIATOR',
        'Aviator Red Monoplane (Terminal 1)',
        currentRoundWager1,
        winMultiplier,
        payout,
        `Cashed out @ ${winMultiplier.toFixed(2)}x (Plane continued flight)`
      );

      setUserBetHistory(prev => [
        {
          id: `AV-WIN-${Date.now().toString().slice(-4)}`,
          bet: currentRoundWager1,
          multiplier: winMultiplier,
          won: payout,
          time: formatTimeWithSeconds(new Date()),
        },
        ...prev.slice(0, 20),
      ]);

      setStatusMessage(`TERMINAL 1 CASHED OUT! Won ₹${payout.toLocaleString('en-IN')} @ ${winMultiplier.toFixed(2)}x!`);
    } else {
      if (!hasBetInCurrentFlight2 || cashedOutAtRef2.current !== null) return;
      const payout = Number((currentRoundWager2 * winMultiplier).toFixed(2));
      cashedOutAtRef2.current = winMultiplier;
      setCashedOutAt2(winMultiplier);
      sounds.cashOutWin();

      recordGameRound(
        'AVIATOR',
        'Aviator Red Monoplane (Terminal 2)',
        currentRoundWager2,
        winMultiplier,
        payout,
        `Cashed out @ ${winMultiplier.toFixed(2)}x (Plane continued flight)`
      );

      setUserBetHistory(prev => [
        {
          id: `AV-WIN-${Date.now().toString().slice(-4)}`,
          bet: currentRoundWager2,
          multiplier: winMultiplier,
          won: payout,
          time: formatTimeWithSeconds(new Date()),
        },
        ...prev.slice(0, 20),
      ]);

      setStatusMessage(`TERMINAL 2 CASHED OUT! Won ₹${payout.toLocaleString('en-IN')} @ ${winMultiplier.toFixed(2)}x!`);
    }
  };

  // Toggle stage bet for Terminal 1
  const handleToggleBet1 = () => {
    if (userStagedNextRound1) {
      setUserStagedNextRound1(false);
      sounds.playClick();
    } else {
      if (!currentUser || currentUser.balance < wager1) {
        setStatusMessage(`Insufficient credits! Available balance is ₹${currentUser?.balance || 0}.`);
        sounds.mineExplode();
        return;
      }
      setUserStagedNextRound1(true);
      sounds.playClick();
    }
  };

  // Toggle stage bet for Terminal 2
  const handleToggleBet2 = () => {
    if (userStagedNextRound2) {
      setUserStagedNextRound2(false);
      sounds.playClick();
    } else {
      if (!currentUser || currentUser.balance < wager2) {
        setStatusMessage(`Insufficient credits! Available balance is ₹${currentUser?.balance || 0}.`);
        sounds.mineExplode();
        return;
      }
      setUserStagedNextRound2(true);
      sounds.playClick();
    }
  };

  // Step adjustments
  const adjustWager1 = (delta: number) => {
    setWager1(prev => Math.max(20, Math.min(currentUser?.balance || 500000, prev + delta)));
  };

  const adjustWager2 = (delta: number) => {
    setWager2(prev => Math.max(20, Math.min(currentUser?.balance || 500000, prev + delta)));
  };

  // Potential payouts
  const potentialCashout1 = Number((currentRoundWager1 * currentMultiplier).toFixed(2));
  const lockedCashoutWon1 = cashedOutAt1 ? Number((currentRoundWager1 * cashedOutAt1).toFixed(2)) : 0;

  const potentialCashout2 = Number((currentRoundWager2 * currentMultiplier).toFixed(2));
  const lockedCashoutWon2 = cashedOutAt2 ? Number((currentRoundWager2 * cashedOutAt2).toFixed(2)) : 0;

  // =========================================================================
  // CANVAS DRAWING ENGINE: 4K HIGH-DPI RED AVIATOR MONOPLANE & FLIGHT RADAR
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(2, window.devicePixelRatio || 1);
    const parentWidth = canvas.parentElement?.clientWidth || 700;
    const parentHeight = 360;

    canvas.width = Math.round(parentWidth * dpr);
    canvas.height = Math.round(parentHeight * dpr);
    canvas.style.width = `${parentWidth}px`;
    canvas.style.height = `${parentHeight}px`;

    let width = parentWidth;
    let height = parentHeight;

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        const newWidth = canvas.parentElement.clientWidth;
        width = newWidth;
        canvas.width = Math.round(newWidth * dpr);
        canvas.height = Math.round(parentHeight * dpr);
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${parentHeight}px`;
      }
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 1. Radar Cockpit Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0c0e15');
      bgGrad.addColorStop(1, '#06070a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Coordinate Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      const gridSpacingX = width / 8;
      const gridSpacingY = height / 6;

      for (let x = 0; x < width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // X & Y Axis baseline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(35, 0);
      ctx.lineTo(35, height - 30);
      ctx.lineTo(width, height - 30);
      ctx.stroke();

      // Axis Markers
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.fillText('1.0x', 8, height - 32);
      ctx.fillText('2.0x', 8, height - 90);
      ctx.fillText('10x', 8, height - 160);
      ctx.fillText('50x', 8, height - 230);
      ctx.fillText('200x', 8, height - 290);
      ctx.fillText('1000x', 6, 20);

      propellerAngleRef.current += flightState === 'FLYING' ? 0.95 : 0.25;

      const startX = 40;
      const startY = height - 35;

      // 3. Monoplane & Flight Curve
      if (flightState === 'FLYING' || flightState === 'CRASHED') {
        const logMult = Math.log10(Math.max(1.0, currentMultiplier));
        const progress = Math.min(0.92, (logMult / 3.0) * 0.92);

        let endX = startX + progress * (width - 110);
        let endY = startY - Math.pow(progress, 0.75) * (height - 90);

        if (flightState === 'CRASHED') {
          endX = Math.min(width + 120, endX + 110);
          endY = Math.max(-80, endY - 90);
        }

        const cpX = startX + (endX - startX) * 0.58;
        const cpY = startY;

        // Area fill under flight curve
        const areaGrad = ctx.createLinearGradient(0, endY, 0, startY);
        if (isMegaFlight) {
          areaGrad.addColorStop(0, 'rgba(234, 179, 8, 0.45)');
          areaGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
          areaGrad.addColorStop(1, 'rgba(234, 179, 8, 0.0)');
        } else {
          areaGrad.addColorStop(0, 'rgba(225, 29, 72, 0.35)');
          areaGrad.addColorStop(0.6, 'rgba(225, 29, 72, 0.12)');
          areaGrad.addColorStop(1, 'rgba(225, 29, 72, 0.0)');
        }

        ctx.fillStyle = areaGrad;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.lineTo(endX, startY);
        ctx.closePath();
        ctx.fill();

        // Glowing neon trajectory line
        ctx.strokeStyle = isMegaFlight
          ? '#facc15'
          : flightState === 'CRASHED'
          ? '#ef4444'
          : '#e11d48';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = isMegaFlight ? 'rgba(250, 204, 21, 0.8)' : 'rgba(225, 29, 72, 0.9)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Render Monoplane at endX, endY
        ctx.save();
        ctx.translate(endX, endY);

        let angle = -0.32;
        if (flightState === 'CRASHED') {
          angle = -0.55;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(-50, 0);
          ctx.lineTo(-120, 20);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.rotate(angle);
        drawOriginalAviatorMonoplane(ctx, true, propellerAngleRef.current, isMegaFlight);
        ctx.restore();
      } else {
        // Runway idling
        ctx.save();
        ctx.translate(startX + 28, startY - 14);
        drawOriginalAviatorMonoplane(ctx, false, propellerAngleRef.current * 0.3, false);
        ctx.restore();
      }

      ctx.restore();
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [flightState, currentMultiplier, isMegaFlight]);

  // Draw authentic Spribe Red Aviator Monoplane
  const drawOriginalAviatorMonoplane = (
    ctx: CanvasRenderingContext2D,
    isFlying: boolean,
    propellerAngle: number,
    megaGold: boolean
  ) => {
    ctx.save();

    // Afterburner jet exhaust
    if (isFlying) {
      const flameLength = 28 + Math.random() * 16;
      const flameGrad = ctx.createLinearGradient(-30, 0, -30 - flameLength, 0);
      if (megaGold) {
        flameGrad.addColorStop(0, '#fef08a');
        flameGrad.addColorStop(0.3, '#f59e0b');
        flameGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      } else {
        flameGrad.addColorStop(0, '#fef08a');
        flameGrad.addColorStop(0.3, '#f97316');
        flameGrad.addColorStop(0.7, '#e11d48');
        flameGrad.addColorStop(1, 'rgba(225, 29, 72, 0)');
      }
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-28, -3);
      ctx.lineTo(-28 - flameLength, 0);
      ctx.lineTo(-28, 3);
      ctx.closePath();
      ctx.fill();
    }

    ctx.shadowColor = megaGold ? 'rgba(234, 179, 8, 0.85)' : 'rgba(225, 29, 72, 0.75)';
    ctx.shadowBlur = 14;

    // Horizontal tail stabilizer
    ctx.fillStyle = megaGold ? '#ca8a04' : '#991b1b';
    ctx.beginPath();
    ctx.moveTo(-22, -1);
    ctx.lineTo(-34, -8);
    ctx.lineTo(-36, -8);
    ctx.lineTo(-26, 1);
    ctx.closePath();
    ctx.fill();

    // Vertical Stabilizer Tail Fin
    ctx.fillStyle = megaGold ? '#eab308' : '#e11d48';
    ctx.beginPath();
    ctx.moveTo(-18, -4);
    ctx.lineTo(-30, -22);
    ctx.lineTo(-35, -21);
    ctx.lineTo(-26, -3);
    ctx.closePath();
    ctx.fill();

    // White racing tail stripe
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-27, -19);
    ctx.lineTo(-24, -5);
    ctx.stroke();

    // Main Fuselage Body
    const bodyGrad = ctx.createLinearGradient(0, -14, 0, 8);
    if (megaGold) {
      bodyGrad.addColorStop(0, '#fef08a');
      bodyGrad.addColorStop(0.45, '#eab308');
      bodyGrad.addColorStop(1, '#a16207');
    } else {
      bodyGrad.addColorStop(0, '#f43f5e');
      bodyGrad.addColorStop(0.4, '#dc2626');
      bodyGrad.addColorStop(1, '#881337');
    }
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.bezierCurveTo(24, -10, 10, -12, -12, -8);
    ctx.lineTo(-28, -2);
    ctx.lineTo(-28, 2);
    ctx.bezierCurveTo(-12, 6, 10, 8, 24, 4);
    ctx.closePath();
    ctx.fill();

    // White Aviator Racing Stripes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(22, 1);
    ctx.quadraticCurveTo(2, -3, -24, 0);
    ctx.stroke();

    // Cockpit Bubble
    const canopyGrad = ctx.createLinearGradient(6, -11, 20, 2);
    canopyGrad.addColorStop(0, '#7dd3fc');
    canopyGrad.addColorStop(0.5, '#0284c7');
    canopyGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = canopyGrad;

    ctx.beginPath();
    ctx.moveTo(20, -1);
    ctx.bezierCurveTo(18, -9, 8, -11, -1, -8);
    ctx.lineTo(2, 0);
    ctx.lineTo(18, 1);
    ctx.closePath();
    ctx.fill();

    // Pilot helmet silhouette
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(8, -4.5, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Foreground Swept Wing
    const wingGrad = ctx.createLinearGradient(0, 0, -10, 24);
    if (megaGold) {
      wingGrad.addColorStop(0, '#facc15');
      wingGrad.addColorStop(1, '#ca8a04');
    } else {
      wingGrad.addColorStop(0, '#ef4444');
      wingGrad.addColorStop(1, '#991b1b');
    }
    ctx.fillStyle = wingGrad;

    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(4, 22);
    ctx.lineTo(-8, 23);
    ctx.lineTo(-12, 1);
    ctx.closePath();
    ctx.fill();

    // Wingtip highlight
    ctx.strokeStyle = megaGold ? '#fef08a' : '#fca5a5';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(3, 21);
    ctx.lineTo(-7, 22);
    ctx.stroke();

    // Nose Cone
    ctx.fillStyle = megaGold ? '#78350f' : '#450a0a';
    ctx.beginPath();
    ctx.arc(30, 0, 4, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Spinning Front Propeller Blades
    ctx.save();
    ctx.translate(32, 0);
    ctx.rotate(propellerAngle);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(-1.5, -16, 3, 32);

    ctx.fillStyle = megaGold ? '#ca8a04' : '#991b1b';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  };

  // Filter player list in details modal
  const filteredModalPlayers = useMemo(() => {
    if (!selectedHistoryItem) return [];
    if (historyFilter === 'CASHED_OUT') {
      return selectedHistoryItem.playerCashouts.filter(p => p.cashedOutAt !== null);
    }
    if (historyFilter === 'CRASHED') {
      return selectedHistoryItem.playerCashouts.filter(p => p.cashedOutAt === null);
    }
    return selectedHistoryItem.playerCashouts;
  }, [selectedHistoryItem, historyFilter]);

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER & MULTIPLIER HISTORY PILL BAR */}
      <div className="bg-[#11141d] border border-[#232736] rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-red-500/80 shadow-[0_0_15px_rgba(225,29,72,0.5)] bg-black shrink-0">
            <img
              src="/assets/aistudio/23420488fb869cabc71d55629110c12b_41a6f0c8.jpg"
              alt="Aviator Icon"
              className="w-full h-full object-contain p-1"
            />
            <span className="absolute bottom-0 inset-x-0 bg-black/90 text-[7px] font-black text-red-400 text-center py-0.5">
              ORIGINAL
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-cinzel text-lg sm:text-xl font-black text-white">Aviator</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                1000x JACKPOT
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Spribe Aesthetic &bull; Dual Betting Terminals &bull; Provably Fair
            </p>
          </div>
        </div>

        {/* CLICKABLE MULTIPLIER HISTORY PILLS */}
        <div className="w-full md:w-auto">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <History className="w-3 h-3 text-amber-400" />
              Round History:
            </span>
            <span className="text-[10px] text-gray-500">Tap to inspect</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full md:max-w-md py-0.5 no-scrollbar">
            {historyRecords.slice(0, 16).map(item => {
              const h = item.multiplier;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedHistoryItem(item);
                    setHistoryFilter('ALL');
                    sounds.playClick();
                  }}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono-numbers font-black shrink-0 border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    h >= 100.0
                      ? 'bg-[#4a1228] text-rose-300 border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                      : h >= 10.0
                      ? 'bg-[#3b1c4e] text-purple-300 border-purple-500/70'
                      : h >= 2.0
                      ? 'bg-[#212445] text-indigo-300 border-indigo-500/60'
                      : 'bg-[#152336] text-sky-300 border-sky-500/40'
                  }`}
                >
                  {h >= 100.0 ? `👑 ${h.toFixed(2)}x` : `${h.toFixed(2)}x`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. MAIN BATTLEGROUND: RADAR SCREEN & DUAL TERMINALS (FULL WIDTH) */}
      <div className="space-y-4">
        {/* THE CENTRAL MULTIPLIER RADAR SCREEN */}
        <div className="relative bg-[#07090e] border border-[#232736] rounded-2xl overflow-hidden shadow-2xl">
            <canvas ref={canvasRef} className="w-full block" />

            {/* Central Display: Countdown or Dynamic Multiplier or Crashed Message */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              {flightState === 'WAITING' ? (
                <div className="text-center bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-emerald-500/30 shadow-2xl">
                  <p className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-1">
                    WAITING FOR NEXT ROUND
                  </p>
                  <div className="font-mono-numbers font-black text-white text-5xl sm:text-6xl drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                    {waitingCountdown.toFixed(1)}s
                  </div>
                  {/* Smooth Countdown Bar */}
                  <div className="w-48 sm:w-60 h-2 bg-gray-800 rounded-full mt-3 overflow-hidden border border-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-100"
                      style={{ width: `${((5.0 - waitingCountdown) / 5.0) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">
                    {userStagedNextRound1 || userStagedNextRound2
                      ? `✓ Bet Staged for upcoming flight`
                      : 'Place your bet now'}
                  </p>
                </div>
              ) : flightState === 'CRASHED' ? (
                <div className="text-center animate-shake">
                  <span className="font-cinzel font-black text-red-500 text-4xl sm:text-6xl tracking-wider block drop-shadow-[0_4px_20px_rgba(239,68,68,0.8)]">
                    FLEW AWAY!
                  </span>
                  <span className="font-mono-numbers text-xl sm:text-2xl font-bold text-gray-300 bg-black/80 px-4 py-1 rounded-full border border-red-500/40 mt-2 inline-block">
                    @ {crashPoint.toFixed(2)}x
                  </span>
                </div>
              ) : (
                <>
                  <span
                    className={`font-mono-numbers font-black tracking-tight drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)] transition-all ${
                      isMegaFlight
                        ? 'text-yellow-300 text-6xl sm:text-7xl drop-shadow-[0_0_35px_rgba(234,179,8,0.8)]'
                        : 'text-white text-6xl sm:text-7xl drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]'
                    }`}
                  >
                    {currentMultiplier.toFixed(2)}x
                  </span>

                  <span
                    className={`text-[10px] sm:text-xs font-bold mt-1.5 tracking-widest uppercase bg-black/70 px-4 py-1 rounded-full border ${
                      isMegaFlight
                        ? 'text-yellow-300 border-yellow-400/60 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                        : 'text-red-400 border-red-500/40'
                    }`}
                  >
                    {isMegaFlight ? '⚡ 1000x JACKPOT CLIMB' : 'RED MONOPLANE AIRBORNE'}
                  </span>
                </>
              )}
            </div>

            {/* Floating Live Cashout Notifications */}
            {hasBetInCurrentFlight1 && cashedOutAt1 !== null && flightState === 'FLYING' && (
              <div className="absolute top-4 left-4 bg-emerald-950/90 border border-emerald-500/80 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-mono-numbers font-black text-white">
                  Bet 1 Cashed: +₹{lockedCashoutWon1} ({cashedOutAt1.toFixed(2)}x)
                </span>
              </div>
            )}

            {hasBetInCurrentFlight2 && cashedOutAt2 !== null && flightState === 'FLYING' && (
              <div className="absolute top-4 right-4 bg-emerald-950/90 border border-emerald-500/80 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-mono-numbers font-black text-white">
                  Bet 2 Cashed: +₹{lockedCashoutWon2} ({cashedOutAt2.toFixed(2)}x)
                </span>
              </div>
            )}
          </div>

          {/* DUAL BETTING TERMINAL LAYOUT (TERMINAL 1 & TERMINAL 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* TERMINAL 1 */}
            <div className="bg-[#11141d] border border-[#232736] rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  BET TERMINAL 1
                </span>

                {/* Segmented Bet / Auto toggle */}
                <div className="flex bg-[#090b10] p-0.5 rounded-lg border border-[#1e2332]">
                  <button
                    onClick={() => setTab1('BET')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      tab1 === 'BET' ? 'bg-[#1e2535] text-white shadow' : 'text-gray-400'
                    }`}
                  >
                    Bet
                  </button>
                  <button
                    onClick={() => setTab1('AUTO')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      tab1 === 'AUTO' ? 'bg-[#1e2535] text-[#f5d061] shadow' : 'text-gray-400'
                    }`}
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Stepper & Input */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={wager1 <= 20}
                  onClick={() => adjustWager1(-10)}
                  className="w-9 h-9 rounded-xl bg-[#181d2a] hover:bg-[#232a3d] border border-[#242c3d] flex items-center justify-center text-gray-300 font-bold disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={20}
                    max={currentUser?.balance || 500000}
                    value={wager1}
                    onChange={e => setWager1(Math.max(20, parseInt(e.target.value, 10) || 20))}
                    className="w-full bg-[#0a0d14] border border-[#242c3d] focus:border-[#d4af37] rounded-xl pl-6 pr-2 py-2 text-sm font-mono-numbers font-bold text-white focus:outline-none text-center"
                  />
                </div>

                <button
                  type="button"
                  disabled={wager1 >= (currentUser?.balance || 500000)}
                  onClick={() => adjustWager1(10)}
                  className="w-9 h-9 rounded-xl bg-[#181d2a] hover:bg-[#232a3d] border border-[#242c3d] flex items-center justify-center text-gray-300 font-bold disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={wager1 >= (currentUser?.balance || 500000)}
                  onClick={() => adjustWager1(50)}
                  className="px-2.5 h-9 rounded-xl bg-[#181d2a] hover:bg-[#232a3d] border border-[#242c3d] flex items-center justify-center text-[#d4af37] font-mono-numbers font-bold text-xs cursor-pointer active:scale-95"
                >
                  +50
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_BETS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setWager1(amt)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono-numbers font-bold transition-all cursor-pointer ${
                      wager1 === amt
                        ? 'bg-[#d4af37] text-black'
                        : 'bg-[#161a26] text-gray-300 hover:bg-[#202738] border border-[#232b3d]'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Terminal 1 Action Button */}
              {flightState === 'FLYING' ? (
                hasBetInCurrentFlight1 ? (
                  cashedOutAt1 !== null ? (
                    <div className="w-full py-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-center">
                      <span className="font-mono-numbers font-black text-xs text-emerald-300 block">
                        CASHED OUT +₹{lockedCashoutWon1}
                      </span>
                      <span className="text-[10px] text-gray-400">Locked @ {cashedOutAt1.toFixed(2)}x</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCashOut(1)}
                      className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all uppercase tracking-wider text-sm flex flex-col items-center justify-center cursor-pointer active:scale-95 animate-pulse"
                    >
                      <span>CASH OUT</span>
                      <span className="font-mono-numbers text-lg text-white">
                        ₹{potentialCashout1.toLocaleString('en-IN')}
                      </span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleToggleBet1}
                    className={`w-full py-3.5 rounded-xl font-black transition-all uppercase text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 border ${
                      userStagedNextRound1
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg'
                    }`}
                  >
                    <span>{userStagedNextRound1 ? 'CANCEL BET' : `BET FOR NEXT FLIGHT (₹${wager1})`}</span>
                  </button>
                )
              ) : flightState === 'WAITING' ? (
                <button
                  onClick={handleToggleBet1}
                  className={`w-full py-4 rounded-xl font-black transition-all uppercase text-sm flex flex-col items-center justify-center cursor-pointer active:scale-95 border ${
                    userStagedNextRound1
                      ? 'bg-rose-950/90 border-rose-500 text-rose-300 hover:bg-rose-900 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  <span>{userStagedNextRound1 ? 'CANCEL (WAITING)' : 'BET'}</span>
                  <span className="font-mono-numbers text-xs opacity-90">
                    {userStagedNextRound1 ? `₹${wager1} Locked` : `₹${wager1}`}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleToggleBet1}
                  className={`w-full py-3.5 rounded-xl font-black transition-all uppercase text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 border ${
                    userStagedNextRound1
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                      : 'bg-[#181d2a] text-gray-300 border-[#242c3d]'
                  }`}
                >
                  <span>{userStagedNextRound1 ? 'BET STAGED' : `BET NEXT FLIGHT (₹${wager1})`}</span>
                </button>
              )}

              {/* Auto Tab Controls */}
              {tab1 === 'AUTO' && (
                <div className="pt-2 border-t border-[#1e2332] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={autoBetEnabled1}
                        onChange={e => setAutoBetEnabled1(e.target.checked)}
                        className="accent-[#d4af37] w-3.5 h-3.5 rounded"
                      />
                      <span>Auto Bet</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={autoCashoutEnabled1}
                        onChange={e => setAutoCashoutEnabled1(e.target.checked)}
                        className="accent-[#d4af37] w-3.5 h-3.5 rounded"
                      />
                      <span>Auto Cash Out</span>
                    </label>
                  </div>

                  {autoCashoutEnabled1 && (
                    <div className="flex items-center justify-between bg-[#0a0d14] p-1.5 rounded-xl border border-[#1e2332]">
                      <span className="text-[11px] text-gray-400">Target Multiplier:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step={0.1}
                          min={1.1}
                          max={1000}
                          value={autoCashoutAt1}
                          onChange={e => setAutoCashoutAt1(parseFloat(e.target.value) || 2.0)}
                          className="w-16 bg-[#161a26] border border-[#232b3d] rounded-lg px-2 py-0.5 text-center font-mono-numbers text-xs text-[#f5d061] font-bold focus:outline-none"
                        />
                        <span className="font-mono-numbers text-xs font-bold text-emerald-400">x</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* TERMINAL 2 */}
            <div className="bg-[#11141d] border border-[#232736] rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  BET TERMINAL 2
                </span>

                {/* Segmented Bet / Auto toggle */}
                <div className="flex bg-[#090b10] p-0.5 rounded-lg border border-[#1e2332]">
                  <button
                    onClick={() => setTab2('BET')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      tab2 === 'BET' ? 'bg-[#1e2535] text-white shadow' : 'text-gray-400'
                    }`}
                  >
                    Bet
                  </button>
                  <button
                    onClick={() => setTab2('AUTO')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      tab2 === 'AUTO' ? 'bg-[#1e2535] text-[#f5d061] shadow' : 'text-gray-400'
                    }`}
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Stepper & Input */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={wager2 <= 20}
                  onClick={() => adjustWager2(-10)}
                  className="w-9 h-9 rounded-xl bg-[#181d2a] hover:bg-[#232a3d] border border-[#242c3d] flex items-center justify-center text-gray-300 font-bold disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={20}
                    max={currentUser?.balance || 500000}
                    value={wager2}
                    onChange={e => setWager2(Math.max(20, parseInt(e.target.value, 10) || 20))}
                    className="w-full bg-[#0a0d14] border border-[#242c3d] focus:border-[#d4af37] rounded-xl pl-6 pr-2 py-2 text-sm font-mono-numbers font-bold text-white focus:outline-none text-center"
                  />
                </div>

                <button
                  type="button"
                  disabled={wager2 >= (currentUser?.balance || 500000)}
                  onClick={() => adjustWager2(10)}
                  className="w-9 h-9 rounded-xl bg-[#181d2a] hover:bg-[#232a3d] border border-[#242c3d] flex items-center justify-center text-gray-300 font-bold disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={wager2 >= (currentUser?.balance || 500000)}
                  onClick={() => adjustWager2(50)}
                  className="px-2.5 h-9 rounded-xl bg-[#181d2a] hover:bg-[#232a3d] border border-[#242c3d] flex items-center justify-center text-[#d4af37] font-mono-numbers font-bold text-xs cursor-pointer active:scale-95"
                >
                  +50
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_BETS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setWager2(amt)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono-numbers font-bold transition-all cursor-pointer ${
                      wager2 === amt
                        ? 'bg-[#d4af37] text-black'
                        : 'bg-[#161a26] text-gray-300 hover:bg-[#202738] border border-[#232b3d]'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Terminal 2 Action Button */}
              {flightState === 'FLYING' ? (
                hasBetInCurrentFlight2 ? (
                  cashedOutAt2 !== null ? (
                    <div className="w-full py-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-center">
                      <span className="font-mono-numbers font-black text-xs text-emerald-300 block">
                        CASHED OUT +₹{lockedCashoutWon2}
                      </span>
                      <span className="text-[10px] text-gray-400">Locked @ {cashedOutAt2.toFixed(2)}x</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCashOut(2)}
                      className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all uppercase tracking-wider text-sm flex flex-col items-center justify-center cursor-pointer active:scale-95 animate-pulse"
                    >
                      <span>CASH OUT</span>
                      <span className="font-mono-numbers text-lg text-white">
                        ₹{potentialCashout2.toLocaleString('en-IN')}
                      </span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleToggleBet2}
                    className={`w-full py-3.5 rounded-xl font-black transition-all uppercase text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 border ${
                      userStagedNextRound2
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg'
                    }`}
                  >
                    <span>{userStagedNextRound2 ? 'CANCEL BET' : `BET FOR NEXT FLIGHT (₹${wager2})`}</span>
                  </button>
                )
              ) : flightState === 'WAITING' ? (
                <button
                  onClick={handleToggleBet2}
                  className={`w-full py-4 rounded-xl font-black transition-all uppercase text-sm flex flex-col items-center justify-center cursor-pointer active:scale-95 border ${
                    userStagedNextRound2
                      ? 'bg-rose-950/90 border-rose-500 text-rose-300 hover:bg-rose-900 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  <span>{userStagedNextRound2 ? 'CANCEL (WAITING)' : 'BET'}</span>
                  <span className="font-mono-numbers text-xs opacity-90">
                    {userStagedNextRound2 ? `₹${wager2} Locked` : `₹${wager2}`}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleToggleBet2}
                  className={`w-full py-3.5 rounded-xl font-black transition-all uppercase text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 border ${
                    userStagedNextRound2
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                      : 'bg-[#181d2a] text-gray-300 border-[#242c3d]'
                  }`}
                >
                  <span>{userStagedNextRound2 ? 'BET STAGED' : `BET NEXT FLIGHT (₹${wager2})`}</span>
                </button>
              )}

              {/* Auto Tab Controls */}
              {tab2 === 'AUTO' && (
                <div className="pt-2 border-t border-[#1e2332] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={autoBetEnabled2}
                        onChange={e => setAutoBetEnabled2(e.target.checked)}
                        className="accent-[#d4af37] w-3.5 h-3.5 rounded"
                      />
                      <span>Auto Bet</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={autoCashoutEnabled2}
                        onChange={e => setAutoCashoutEnabled2(e.target.checked)}
                        className="accent-[#d4af37] w-3.5 h-3.5 rounded"
                      />
                      <span>Auto Cash Out</span>
                    </label>
                  </div>

                  {autoCashoutEnabled2 && (
                    <div className="flex items-center justify-between bg-[#0a0d14] p-1.5 rounded-xl border border-[#1e2332]">
                      <span className="text-[11px] text-gray-400">Target Multiplier:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step={0.1}
                          min={1.1}
                          max={1000}
                          value={autoCashoutAt2}
                          onChange={e => setAutoCashoutAt2(parseFloat(e.target.value) || 2.0)}
                          className="w-16 bg-[#161a26] border border-[#232b3d] rounded-lg px-2 py-0.5 text-center font-mono-numbers text-xs text-[#f5d061] font-bold focus:outline-none"
                        />
                        <span className="font-mono-numbers text-xs font-bold text-emerald-400">x</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. LIVE COMMUNITY FEED & LIVE PLAYER BETTING STATISTICS (LOWER SECTION) */}
        <div className="bg-[#11141d] border border-[#232736] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          {/* Live Betting Statistics Bar (4 Cards) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                  Live Round Betting Statistics
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="text-emerald-400 font-medium">Real-Time Multiplier Feed</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#0b0e16] border border-[#1e2332] rounded-xl p-3">
                <span className="text-[10px] text-gray-400 font-medium block">Active Bets in Round</span>
                <span className="text-lg font-black font-mono-numbers text-white flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  {liveStats.totalBets}
                </span>
              </div>

              <div className="bg-[#0b0e16] border border-[#1e2332] rounded-xl p-3">
                <span className="text-[10px] text-gray-400 font-medium block">Total In Play</span>
                <span className="text-lg font-black font-mono-numbers text-[#f5d061] flex items-center gap-1.5 mt-0.5">
                  ₹{liveStats.totalStaked.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-[#0b0e16] border border-[#1e2332] rounded-xl p-3">
                <span className="text-[10px] text-gray-400 font-medium block">Total Cashed Out</span>
                <span className="text-lg font-black font-mono-numbers text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  ₹{liveStats.totalWon.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-[#0b0e16] border border-[#1e2332] rounded-xl p-3">
                <span className="text-[10px] text-gray-400 font-medium block">Cashout Ratio / Peak</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-lg font-black font-mono-numbers text-purple-300">
                    {liveStats.cashoutRate}%
                  </span>
                  <span className="text-xs font-mono-numbers font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-1.5 py-0.5 rounded">
                    {liveStats.topMultiplier.toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Community Feed & Tabs */}
          <div className="border-t border-[#1e2332] pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center bg-[#0a0d14] p-1 rounded-xl border border-[#1e2332] w-full sm:w-auto">
                {(['ALL', 'MY_BETS', 'TOP'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setLiveBetsTab(tab)}
                    className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      liveBetsTab === tab
                        ? 'bg-[#1e2535] text-white shadow-sm border border-[#2d374d]'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {tab === 'ALL'
                      ? `All Bets (${currentLiveBets.length})`
                      : tab === 'MY_BETS'
                      ? `My Bets (${userBetHistory.length})`
                      : 'Top Wins (10x+)'}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-gray-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Provably Fair Cryptographic Seeds Active</span>
              </div>
            </div>

            {/* Live Bet Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto max-h-[320px] pr-1">
              {liveBetsTab === 'ALL' ? (
                currentLiveBets.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-gray-500">
                    Waiting for players to place wagers for the upcoming flight...
                  </div>
                ) : (
                  currentLiveBets.map(b => (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all border ${
                        b.cashedOut
                          ? 'bg-emerald-950/25 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                          : 'bg-[#0c0e15] border-[#1a1e2b]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{b.avatar}</span>
                        <div className="truncate">
                          <p className="font-bold text-gray-200 text-xs truncate leading-tight">{b.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono-numbers">
                            Bet: ₹{b.betAmount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {b.cashedOut ? (
                          <div className="text-right">
                            <span className="font-mono-numbers font-black text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 rounded-lg inline-block">
                              {b.targetCashout.toFixed(2)}x
                            </span>
                            <p className="text-[10px] text-emerald-300 font-mono-numbers font-bold mt-0.5">
                              +₹{Math.round(b.betAmount * b.targetCashout).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ) : flightState === 'CRASHED' ? (
                          <span className="text-[10px] font-mono-numbers text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30 inline-block">
                            -₹{b.betAmount}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono-numbers text-gray-300 bg-[#161a26] px-2 py-0.5 rounded border border-[#252c3f] animate-pulse inline-block">
                            In Flight
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )
              ) : liveBetsTab === 'MY_BETS' ? (
                userBetHistory.length === 0 ? (
                  <p className="col-span-full text-xs text-gray-500 text-center py-8">
                    No personal bets placed yet in this session.
                  </p>
                ) : (
                  userBetHistory.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c0e15] border border-[#1a1e2b] text-xs"
                    >
                      <div>
                        <span className="font-mono-numbers text-gray-300 font-bold">₹{h.bet}</span>
                        <p className="text-[10px] text-gray-500">{h.time}</p>
                      </div>
                      <div className="text-right">
                        {h.multiplier ? (
                          <span className="font-mono-numbers font-bold text-emerald-400 text-xs">
                            +{h.multiplier.toFixed(2)}x (₹{h.won})
                          </span>
                        ) : (
                          <span className="font-mono-numbers text-rose-400 text-xs">Flew Away</span>
                        )}
                      </div>
                    </div>
                  ))
                )
              ) : (
                historyRecords
                  .filter(r => r.multiplier >= 10)
                  .slice(0, 12)
                  .map(r => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c0e15] border border-[#1a1e2b] text-xs"
                    >
                      <div>
                        <span className="font-bold text-amber-300">{r.id}</span>
                        <p className="text-[10px] text-gray-500">{r.formattedTime}</p>
                      </div>
                      <span className="font-mono-numbers font-black text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded-lg">
                        {r.multiplier.toFixed(2)}x
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

      {/* 3. MODAL: DETAILED ROUND INSPECTION WITH EXACT SECONDS & PLAYERS CASHOUTS */}
      {selectedHistoryItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedHistoryItem(null)}
        >
          <div
            className="bg-[#0e121a] border-2 border-[#d4af37]/60 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedHistoryItem(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#182030] hover:bg-[#253046] border border-[#242c3d] flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-[#242c3d]">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-mono-numbers font-black shadow-lg border ${
                  selectedHistoryItem.multiplier >= 100
                    ? 'bg-gradient-to-br from-yellow-500 to-amber-700 text-black border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.5)]'
                    : selectedHistoryItem.multiplier >= 10
                    ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-black border-amber-300'
                    : selectedHistoryItem.multiplier >= 2
                    ? 'bg-purple-950 text-purple-300 border-purple-500'
                    : 'bg-[#152336] text-sky-300 border-sky-500/50'
                }`}
              >
                {selectedHistoryItem.multiplier >= 100 ? '👑' : '✈️'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                    ROUND {selectedHistoryItem.id}
                  </h3>
                  <span
                    className={`font-mono-numbers font-black text-xs px-2.5 py-0.5 rounded-full border ${
                      selectedHistoryItem.multiplier >= 100
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                        : selectedHistoryItem.multiplier >= 2
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                    }`}
                  >
                    FLEW AWAY @ {selectedHistoryItem.multiplier.toFixed(2)}x
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Autonomous Spribe Flight &bull; Verified Provably Fair Round
                </p>
              </div>
            </div>

            {/* Exact Timestamp */}
            <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#121622] p-3.5 rounded-2xl border border-[#242c3d]">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#d4af37] shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Date of Flight</p>
                  <p className="text-xs font-bold text-white font-mono-numbers">
                    {selectedHistoryItem.formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">
                    Time of Crash (Exact Seconds)
                  </p>
                  <p className="text-xs font-bold text-emerald-400 font-mono-numbers">
                    {selectedHistoryItem.formattedTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Provably Fair Hash */}
            <div className="bg-[#090c13] p-3 rounded-xl border border-[#1e2535] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-gray-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Provably Fair Server Hash:
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  VERIFIED
                </span>
              </div>
              <p className="font-mono text-[10px] text-gray-400 break-all select-all bg-[#0d1019] p-2 rounded-lg border border-[#1a202c]">
                {selectedHistoryItem.roundHash}
              </p>
            </div>

            {/* Player Cashout Breakdown */}
            <div className="mt-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wide">
                  <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Players Cashout Log:</span>
                </div>

                <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded-lg border border-[#242c3d]">
                  {(['ALL', 'CASHED_OUT', 'CRASHED'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setHistoryFilter(tab)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        historyFilter === tab ? 'bg-[#d4af37] text-black font-black' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab === 'ALL' ? 'All' : tab === 'CASHED_OUT' ? 'Won' : 'Lost'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 pr-1 space-y-1.5 max-h-60">
                {filteredModalPlayers.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No players in this filter category.</p>
                ) : (
                  filteredModalPlayers.map((player, pIdx) => {
                    const didCashout = player.cashedOutAt !== null;
                    return (
                      <div
                        key={pIdx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                          player.isUser
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'bg-[#121622] border-[#1e2535]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{player.avatar}</span>
                          <div>
                            <span className={`font-bold ${player.isUser ? 'text-[#f5d061]' : 'text-gray-200'}`}>
                              {player.playerName}
                            </span>
                            <span className="block text-[10px] text-gray-400 font-mono-numbers">
                              Wager: ₹{player.betAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          {didCashout ? (
                            <div>
                              <span className="font-mono-numbers font-bold text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-lg inline-block">
                                Cashed @ {player.cashedOutAt?.toFixed(2)}x
                              </span>
                              <p className="text-[11px] font-mono-numbers font-black text-emerald-300 mt-0.5">
                                +₹{player.wonAmount.toLocaleString('en-IN')}
                              </p>
                            </div>
                          ) : (
                            <span className="font-mono-numbers font-bold text-[11px] text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-lg inline-block">
                              Crashed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#242c3d] flex justify-end">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a2130] hover:bg-[#253046] text-gray-200 border border-[#242c3d] cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPACT SCOREBOARD TOGGLE BUTTON & EXPANDABLE VIEW */}
      <div className="pt-2">
        <button
          onClick={() => setShowScoreboard(prev => !prev)}
          className="w-full py-3.5 px-4 sm:px-5 rounded-2xl bg-[#111520] hover:bg-[#161c2b] border border-[#232c3f] hover:border-amber-500/40 text-gray-200 transition-all flex items-center justify-between group shadow-lg cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-bold text-xs sm:text-sm text-gray-100 group-hover:text-amber-300 transition-colors block">
                Original Red Aviator Live Scoreboard & Hall of Fame
              </span>
              <p className="text-[10px] sm:text-[11px] text-gray-400">
                {showScoreboard
                  ? 'Tap to collapse global rankings and high-roller statistics'
                  : 'Tap to view high-roller multipliers, daily champions & round rankings'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl group-hover:bg-amber-950/70 transition-all shrink-0">
            <span>{showScoreboard ? 'Hide' : 'View Full Scoreboard'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showScoreboard ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {showScoreboard && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <GameScoreboard gameType="AVIATOR" gameTitle="Original Red Aviator" />
          </div>
        )}
      </div>
    </div>
  );
};

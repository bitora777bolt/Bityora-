import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  RotateCcw,
  Sparkles,
  ArrowDown,
  Layers,
  Award,
} from 'lucide-react';
import { GameScoreboard } from '../common/GameScoreboard';

// Floor Profit and Multiplier progression matching user rule:
// 1 Rupee = 10 Paise profit on Floor 1 (+10% -> 1.10x), scaling up with each additional floor
const FLOOR_MULTIPLIERS = [
  1.10, // Floor 1 (+10% profit: ₹1 wager = ₹0.10 profit)
  1.25, // Floor 2 (+25%)
  1.45, // Floor 3 (+45%)
  1.70, // Floor 4 (+70%)
  2.05, // Floor 5 (+105%)
  2.50, // Floor 6 (+150%)
  3.10, // Floor 7 (+210%)
  3.85, // Floor 8 (+285%)
  4.80, // Floor 9 (+380%)
  6.00, // Floor 10 (+500%)
  7.50, // Floor 11
  9.50, // Floor 12
  12.00, // Floor 13
  15.50, // Floor 14
  20.00, // Floor 15
  26.00, // Floor 16
  34.00, // Floor 17
  45.00, // Floor 18
  60.00, // Floor 19
  80.00, // Floor 20
  110.00, // Floor 21
  150.00, // Floor 22
  200.00, // Floor 23
  280.00, // Floor 24
  400.00, // Floor 25
];

export type CraneDifficulty = 'HARD' | 'EXTREME' | 'INSANE';

interface DifficultySetting {
  name: string;
  tolerancePercent: number; // Max allowed offset relative to width
  swingSpeed: number; // Radians per second
  swingAngle: number; // Max swing angle in degrees
  description: string;
  badge: string;
}

const CRANE_DIFFICULTIES: Record<CraneDifficulty, DifficultySetting> = {
  HARD: {
    name: 'Hard (Standard)',
    tolerancePercent: 0.26, // 26% max offset tolerance before slipping off
    swingSpeed: 2.2,
    swingAngle: 22,
    description: 'Authentic slippery cottage physics & fast swinging crane',
    badge: 'DEFAULT HARD',
  },
  EXTREME: {
    name: 'Extreme Challenge',
    tolerancePercent: 0.18, // 18% max offset tolerance
    swingSpeed: 2.8,
    swingAngle: 28,
    description: 'High-speed crane sway & knife-edge landing tolerance',
    badge: 'HIGH STAKES',
  },
  INSANE: {
    name: 'Insane Precision',
    tolerancePercent: 0.12, // 12% max offset tolerance
    swingSpeed: 3.5,
    swingAngle: 34,
    description: 'Ultra-fast sway with razor-sharp balance needed',
    badge: 'MAX RISK',
  },
};

interface StackedFloor {
  x: number; // Center x
  y: number; // Center y
  width: number;
  height: number;
  rotation: number;
  floorNumber: number;
}

interface FallingBlock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  width: number;
  height: number;
  isSlipping: boolean;
  slipDirection: number; // -1 = left, +1 = right
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export const TowerGame: React.FC = () => {
  const { currentUser, recordGameRound } = useGame();

  // Wager & Difficulty
  const [wager, setWager] = useState<number>(100);
  const [difficulty, setDifficulty] = useState<CraneDifficulty>('HARD');

  // Game states: IDLE | PLAYING | FALLING | SLIPPING | WON | LOST
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FALLING' | 'SLIPPING' | 'WON' | 'LOST'>('IDLE');
  const [stackedFloors, setStackedFloors] = useState<StackedFloor[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Press "START TOWER RUSH" to operate the crane and stack cottage floors!'
  );
  const [lastWinPayout, setLastWinPayout] = useState<number>(0);
  const [lossAmount, setLossAmount] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([1.10, 2.50, 1.45, 6.00, 1.25, 3.85, 1.70]);

  // Canvas & Animation refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const floorImageRef = useRef<HTMLImageElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Crane simulation state kept in refs for 60fps / 120fps physics loop
  const craneRef = useRef({
    swingTime: 0,
    cableLength: 130, // Distance from crane trolley to floor center
    pivotX: 400, // Logical canvas width / 2
    pivotY: 70, // Crane trolley altitude
    currentAngle: 0,
    blockX: 400,
    blockY: 200,
  });

  const fallingBlockRef = useRef<FallingBlock | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cameraYRef = useRef<number>(0);
  const targetCameraYRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);

  const activeDifficulty = CRANE_DIFFICULTIES[difficulty];
  const currentFloorCount = stackedFloors.length;
  const nextFloorNumber = currentFloorCount + 1;
  const nextMultiplier =
    nextFloorNumber <= FLOOR_MULTIPLIERS.length
      ? FLOOR_MULTIPLIERS[nextFloorNumber - 1]
      : Number((1.10 + nextFloorNumber * 0.4).toFixed(2));
  const potentialCashout = Number((wager * currentMultiplier).toFixed(2));
  const nextFloorProfit = Number((wager * (nextMultiplier - currentMultiplier)).toFixed(2));

  // Preload Image 2 (Cottage block)
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/aistudio/7e4a22accb6298297a8b72b7d70da6d213a3d13e_fa198e7d.webp';
    img.onload = () => {
      floorImageRef.current = img;
    };
  }, []);

  // Quick bet adjuster
  const adjustWager = (delta: number) => {
    if (gameState === 'PLAYING' || gameState === 'FALLING' || gameState === 'SLIPPING') return;
    setWager(prev => {
      const next = prev + delta;
      return Math.max(20, Math.min(currentUser?.balance || 5000, next));
    });
  };

  // Spawn landing dust & gold sparkle particles
  const spawnLandingParticles = (x: number, y: number, count: number = 20) => {
    const colors = ['#f59e0b', '#facc15', '#ffffff', '#ca8a04', '#10b981'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        alpha: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
        life: 0,
        maxLife: Math.random() * 25 + 20,
      });
    }
  };

  // Spawn crash debris particles
  const spawnCrashParticles = (x: number, y: number) => {
    const colors = ['#ef4444', '#b91c1c', '#78350f', '#f97316', '#451a03', '#ffffff'];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        life: 0,
        maxLife: Math.random() * 35 + 25,
      });
    }
  };

  // Start a new run
  const handleStartGame = () => {
    if (!currentUser) return;
    if (currentUser.isSuspended) {
      setStatusMessage('Account suspended by administrator. Cannot play.');
      return;
    }
    if (currentUser.balance < wager) {
      setStatusMessage(`Insufficient Winnings Balance. Available: ₹${currentUser.balance}`);
      return;
    }

    sounds.chipClick();
    sounds.planeAscend();

    // Reset game arena
    setStackedFloors([]);
    fallingBlockRef.current = null;
    particlesRef.current = [];
    cameraYRef.current = 0;
    targetCameraYRef.current = 0;
    screenShakeRef.current = 0;
    craneRef.current.swingTime = 0;
    setCurrentMultiplier(1.0);
    setLastWinPayout(0);
    setLossAmount(0);

    setGameState('PLAYING');
    setStatusMessage(
      'Crane swinging! Tap "DROP FLOOR" or click arena to drop Cottage Floor 1. (+10% Profit on Landing)'
    );
  };

  // Drop floor from swinging crane
  const handleDropFloor = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    sounds.chipClick();

    // Detach block from crane with current position and tangential velocity
    const crane = craneRef.current;
    const diff = CRANE_DIFFICULTIES[difficulty];
    const maxRad = (diff.swingAngle * Math.PI) / 180;
    const omega = diff.swingSpeed;
    // Angular velocity: dtheta/dt = maxRad * omega * cos(omega * t)
    const dTheta = maxRad * omega * Math.cos(omega * crane.swingTime);
    // Tangential horizontal velocity: vx = L * dTheta * cos(theta)
    const vx = (crane.cableLength * dTheta * Math.cos(crane.currentAngle)) / 45;

    fallingBlockRef.current = {
      x: crane.blockX,
      y: crane.blockY,
      vx: vx,
      vy: 2.0,
      rotation: crane.currentAngle * 0.7,
      rotSpeed: (dTheta * 0.4) / 45,
      width: 104,
      height: 94,
      isSlipping: false,
      slipDirection: 0,
    };

    setGameState('FALLING');
    setStatusMessage(`Dropping Cottage Floor ${stackedFloors.length + 1}... Watch the alignment!`);
  }, [gameState, difficulty, stackedFloors.length]);

  // Cash out
  const handleCashOut = () => {
    if ((gameState !== 'PLAYING' && gameState !== 'FALLING') || stackedFloors.length === 0) return;

    const payout = Number((wager * currentMultiplier).toFixed(2));
    sounds.cashOutWin();

    setGameState('WON');
    setLastWinPayout(payout);
    setStatusMessage(
      `🏆 CASHED OUT! Won ₹${payout.toLocaleString('en-IN')} (${currentMultiplier.toFixed(2)}x) with ${
        stackedFloors.length
      } floors stacked!`
    );

    setHistory(prev => [currentMultiplier, ...prev.slice(0, 14)]);

    recordGameRound(
      'TOWER_CLIMB',
      'Tower Rush',
      wager,
      currentMultiplier,
      payout,
      `Cashed out with ${stackedFloors.length} floors stacked at ${currentMultiplier.toFixed(2)}x`
    );
  };

  // Main 4K Canvas Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const renderLoop = (time: number) => {
      if (!isRunning) return;

      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05); // Cap dt to 50ms
      lastTimeRef.current = time;

      // Logical dimensions
      const logicW = 800;
      const logicH = 620;
      const groundY = logicH - 80; // Baseline floor altitude

      // Hi-DPI scaling
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== logicW * dpr || canvas.height !== logicH * dpr) {
        canvas.width = logicW * dpr;
        canvas.height = logicH * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Smooth camera interpolation
      cameraYRef.current += (targetCameraYRef.current - cameraYRef.current) * 0.1;

      // Screen shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (screenShakeRef.current > 0) {
        shakeOffsetX = (Math.random() - 0.5) * screenShakeRef.current * 8;
        shakeOffsetY = (Math.random() - 0.5) * screenShakeRef.current * 8;
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 2.5);
      }

      // Apply camera view
      ctx.translate(shakeOffsetX, shakeOffsetY + cameraYRef.current);

      // 1. Draw Sky & Town Background
      const skyGrad = ctx.createLinearGradient(0, -logicH * 2, 0, logicH);
      skyGrad.addColorStop(0, '#040d1a');
      skyGrad.addColorStop(0.3, '#0b1d3a');
      skyGrad.addColorStop(0.65, '#255085');
      skyGrad.addColorStop(0.9, '#5d8ec4');
      skyGrad.addColorStop(1, '#93bce3');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-100, -logicH * 3, logicW + 200, logicH * 5);

      // Soft Clouds in Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(160, 220 - cameraYRef.current * 0.2, 70, 0, Math.PI * 2);
      ctx.arc(220, 200 - cameraYRef.current * 0.2, 90, 0, Math.PI * 2);
      ctx.arc(290, 220 - cameraYRef.current * 0.2, 65, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(580, 150 - cameraYRef.current * 0.2, 60, 0, Math.PI * 2);
      ctx.arc(640, 130 - cameraYRef.current * 0.2, 85, 0, Math.PI * 2);
      ctx.arc(710, 150 - cameraYRef.current * 0.2, 60, 0, Math.PI * 2);
      ctx.fill();

      // Distant Town Cottage Silhouettes (Aesthetic match with Image 1)
      ctx.fillStyle = 'rgba(10, 22, 40, 0.45)';
      ctx.fillRect(40, groundY - 140, 110, 140);
      ctx.beginPath();
      ctx.moveTo(30, groundY - 140);
      ctx.lineTo(95, groundY - 190);
      ctx.lineTo(160, groundY - 140);
      ctx.fill();

      ctx.fillRect(logicW - 170, groundY - 160, 120, 160);
      ctx.beginPath();
      ctx.moveTo(logicW - 180, groundY - 160);
      ctx.lineTo(logicW - 110, groundY - 210);
      ctx.lineTo(logicW - 40, groundY - 160);
      ctx.fill();

      // Ground Pavement Platform (Aesthetic match with Image 1 foundation)
      const pavementGrad = ctx.createLinearGradient(0, groundY, 0, logicH);
      pavementGrad.addColorStop(0, '#1c1b18');
      pavementGrad.addColorStop(0.1, '#2d2b27');
      pavementGrad.addColorStop(0.4, '#171614');
      pavementGrad.addColorStop(1, '#0b0b0a');
      ctx.fillStyle = pavementGrad;
      ctx.fillRect(-100, groundY, logicW + 200, logicH - groundY + 100);

      // Stone curbs and gold trim on foundation
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(logicW / 2 - 130, groundY, 260, 4);

      // Foundation Pedestal Base
      ctx.fillStyle = '#3a3428';
      ctx.beginPath();
      ctx.roundRect(logicW / 2 - 110, groundY + 4, 220, 36, [4, 4, 8, 8]);
      ctx.fill();
      ctx.strokeStyle = '#f5d061';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f5d061';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏛️ TOWER RUSH FOUNDATION 🏛️', logicW / 2, groundY + 26);

      // 2. Render Stacked Cottage Floors
      const floorImg = floorImageRef.current;
      stackedFloors.forEach((floor, idx) => {
        ctx.save();
        ctx.translate(floor.x, floor.y);
        ctx.rotate(floor.rotation);

        if (floorImg && floorImg.complete) {
          ctx.drawImage(floorImg, -floor.width / 2, -floor.height / 2, floor.width, floor.height);
        } else {
          // Fallback wooden hexagon block
          ctx.fillStyle = '#d97706';
          ctx.fillRect(-floor.width / 2, -floor.height / 2, floor.width, floor.height);
        }

        // Floor Level Badge Pill on side
        ctx.restore();
        ctx.save();
        ctx.translate(floor.x + floor.width / 2 + 18, floor.y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-22, -12, 44, 24, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`F${floor.floorNumber}`, 0, 0);
        ctx.restore();
      });

      // 3. Falling / Slipping Block Physics
      const falling = fallingBlockRef.current;
      if (falling) {
        if (!falling.isSlipping) {
          // Normal free fall with gravity
          falling.vy += 850 * dt; // Gravity
          falling.y += falling.vy * dt;
          falling.x += falling.vx * dt;
          falling.rotation += falling.rotSpeed * dt;

          // Target resting altitude
          let targetY = groundY - falling.height / 2 + 4;
          let targetX = logicW / 2;

          if (stackedFloors.length > 0) {
            const topFloor = stackedFloors[stackedFloors.length - 1];
            targetY = topFloor.y - falling.height + 10;
            targetX = topFloor.x;
          }

          // Check if falling block hit the roof of the stack
          if (falling.y >= targetY) {
            falling.y = targetY;
            const offset = falling.x - targetX;
            const maxAllowedOffset = falling.width * activeDifficulty.tolerancePercent;

            // HARD PHYSICS CHECK:
            // Unstable floor piece slides off and falls down, triggering collapse and round reset
            if (Math.abs(offset) <= maxAllowedOffset) {
              // SUCCESSFUL LANDING!
              sounds.gemReveal();
              spawnLandingParticles(falling.x, targetY + falling.height / 2, 24);

              const newFloorNumber = stackedFloors.length + 1;
              const newStacked: StackedFloor = {
                x: falling.x,
                y: targetY,
                width: falling.width,
                height: falling.height,
                rotation: offset * 0.0006, // Slight realistic wobble based on offset
                floorNumber: newFloorNumber,
              };

              const updatedFloors = [...stackedFloors, newStacked];
              setStackedFloors(updatedFloors);
              fallingBlockRef.current = null;

              // Calculate new multiplier
              const newMult =
                newFloorNumber <= FLOOR_MULTIPLIERS.length
                  ? FLOOR_MULTIPLIERS[newFloorNumber - 1]
                  : Number((1.10 + newFloorNumber * 0.4).toFixed(2));
              setCurrentMultiplier(newMult);

              // Shift camera up smoothly
              targetCameraYRef.current = Math.max(0, (newFloorNumber - 2) * (falling.height - 10));

              setGameState('PLAYING');
              setStatusMessage(
                `🎉 Floor ${newFloorNumber} Placed Solidly! Current: ${newMult.toFixed(
                  2
                )}x (+₹${((newMult - 1.0) * wager).toFixed(2)} Profit). Drop Floor ${newFloorNumber + 1} or Cash Out!`
              );
            } else {
              // MISSED ALIGNMENT -> SLIP OFF & CRASH TO THE GROUND!
              sounds.mineExplode();
              falling.isSlipping = true;
              falling.slipDirection = offset > 0 ? 1 : -1;
              falling.vx = falling.slipDirection * 240;
              falling.vy = -120; // Slight bounce off roof before tumbling
              falling.rotSpeed = falling.slipDirection * 6.5;
              screenShakeRef.current = 1.0;
              setGameState('SLIPPING');
              setStatusMessage(
                `⚠️ Misaligned! Floor slipped off the roof and tumbled into the abyss! Round Lost: ₹${wager}.`
              );
            }
          }
        } else {
          // Slipping & Tumbling off edge
          falling.vy += 980 * dt;
          falling.y += falling.vy * dt;
          falling.x += falling.vx * dt;
          falling.rotation += falling.rotSpeed * dt;

          // If tumbled off screen
          if (falling.y > groundY + 300) {
            spawnCrashParticles(falling.x, groundY);
            fallingBlockRef.current = null;
            setGameState('LOST');
            setLossAmount(wager);
            setStatusMessage(`💥 TOWER COLLAPSED! Floor slipped off. Total loss: ₹${wager}. Try again!`);

            recordGameRound(
              'TOWER_CLIMB',
              'Tower Rush',
              wager,
              0,
              0,
              `Floor slipped off edge on Floor ${stackedFloors.length + 1} (${difficulty} Mode)`
            );
          }
        }

        // Draw the falling/slipping cottage block
        ctx.save();
        ctx.translate(falling.x, falling.y);
        ctx.rotate(falling.rotation);
        if (floorImg && floorImg.complete) {
          ctx.drawImage(floorImg, -falling.width / 2, -falling.height / 2, falling.width, falling.height);
        } else {
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(-falling.width / 2, -falling.height / 2, falling.width, falling.height);
        }
        ctx.restore();
      }

      // 4. Update and Draw Crane (Trolley, Pulley, Cable, & Hooked Floor)
      // Crane altitude tracks above current tower top
      const craneAltitude = -cameraYRef.current + 60;
      craneRef.current.pivotY = craneAltitude;
      craneRef.current.pivotX = logicW / 2;

      // Heavy Overhead Steel Crane Girder
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-50, craneAltitude - 24, logicW + 100, 24);
      // Yellow hazard caution stripes on crane girder
      ctx.save();
      ctx.beginPath();
      ctx.rect(-50, craneAltitude - 24, logicW + 100, 24);
      ctx.clip();
      ctx.fillStyle = '#facc15';
      for (let x = -50; x < logicW + 100; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, craneAltitude - 24);
        ctx.lineTo(x + 18, craneAltitude - 24);
        ctx.lineTo(x - 2, craneAltitude);
        ctx.lineTo(x - 20, craneAltitude);
        ctx.fill();
      }
      ctx.restore();

      // Crane Girder Rails
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-50, craneAltitude);
      ctx.lineTo(logicW + 100, craneAltitude);
      ctx.stroke();

      // Crane Trolley / Winch
      const trolleyX = logicW / 2;
      const trolleyY = craneAltitude;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(trolleyX - 32, trolleyY - 14, 64, 18, 4);
      ctx.fill();
      ctx.stroke();

      // Pulley Wheels
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(trolleyX - 18, trolleyY, 6, 0, Math.PI * 2);
      ctx.arc(trolleyX + 18, trolleyY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Crane Pendulum Motion calculation
      if (gameState === 'PLAYING') {
        craneRef.current.swingTime += dt;
        const maxRad = (activeDifficulty.swingAngle * Math.PI) / 180;
        const currentAngle = maxRad * Math.sin(activeDifficulty.swingSpeed * craneRef.current.swingTime);
        craneRef.current.currentAngle = currentAngle;

        // Position of floor center on the pendulum
        const cableL = craneRef.current.cableLength;
        const hookX = trolleyX + Math.sin(currentAngle) * cableL;
        const hookY = trolleyY + Math.cos(currentAngle) * cableL;
        craneRef.current.blockX = hookX;
        craneRef.current.blockY = hookY;

        // Draw Steel Swinging Cable
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(trolleyX, trolleyY + 4);
        ctx.lineTo(hookX, hookY - 45);
        ctx.stroke();

        // Plumb line laser alignment (subtle guide)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hookX, hookY);
        ctx.lineTo(hookX, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Heavy Crane Hook holding the cottage floor
        ctx.save();
        ctx.translate(hookX, hookY - 45);
        ctx.rotate(currentAngle * 0.8);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -6, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 10);
        ctx.arc(6, 10, 6, Math.PI, 0, true);
        ctx.stroke();
        ctx.restore();

        // The Cottage Floor Block on Crane (Image 2)
        ctx.save();
        ctx.translate(hookX, hookY);
        ctx.rotate(currentAngle * 0.7);

        const blockW = 104;
        const blockH = 94;
        if (floorImg && floorImg.complete) {
          ctx.drawImage(floorImg, -blockW / 2, -blockH / 2, blockW, blockH);
        } else {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-blockW / 2, -blockH / 2, blockW, blockH);
        }

        // Swaying cottage indicator badge
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-24, -blockH / 2 - 14, 48, 16, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`+10%`, 0, -blockH / 2 - 3);

        ctx.restore();
      }

      // 5. Update and Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 2.5 * dt; // Gravity on particles
        p.life += 1;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [gameState, activeDifficulty, stackedFloors, wager]);

  // Spacebar hotkey to drop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState === 'PLAYING') {
        e.preventDefault();
        handleDropFloor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleDropFloor]);

  const QUICK_BETS = [20, 50, 100, 250, 500, 1000];

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Authentic Game App Icon */}
      <div className="bg-[#0e121a] border border-[#d4af37]/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3.5">
          {/* Authentic Tower Rush App Icon (Image 1) */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.4)] shrink-0 bg-[#0a121c]">
            <img
              src="/assets/aistudio/c0952c3af55efd06b19459ccd6e8386d2fbbef10_61b5ddf3.webp"
              alt="Tower Rush App Icon"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-black text-amber-300 text-center py-0.5 tracking-wider uppercase">
              TOWER RUSH
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                Tower Rush
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                CRANE COTTAGE STACK
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                <Crown className="w-3 h-3 text-emerald-400" />
                1 RUPEE = 10 PAISE PROFIT ON F1 (+10%)
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Swing crane &bull; Drop cottage blocks on target &bull; Beware of slippery edges &bull; Cash out anytime!
            </p>
          </div>
        </div>

        {/* History Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full md:max-w-md py-1">
          <History className="w-3.5 h-3.5 text-gray-500 shrink-0 mr-1" />
          {history.map((h, i) => (
            <span
              key={i}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-numbers font-black shrink-0 border transition-all ${
                h >= 6.0
                  ? 'bg-gradient-to-r from-yellow-500/40 via-amber-400/40 to-rose-500/40 text-yellow-200 border-yellow-300 shadow-[0_0_14px_rgba(234,179,8,0.7)] ring-1 ring-yellow-300'
                  : h >= 2.0
                  ? 'bg-amber-500/20 text-yellow-300 border-amber-400/60 shadow-md'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {h >= 6.0 ? `👑 ${h.toFixed(2)}x` : `${h.toFixed(2)}x`}
            </span>
          ))}
        </div>
      </div>

      {/* 2. MAIN 4K GAME ARENA (CANVAS) */}
      <div className="space-y-2">
        {/* Real-time progress bar */}
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                gameState === 'PLAYING'
                  ? 'bg-amber-400 animate-ping'
                  : gameState === 'FALLING'
                  ? 'bg-sky-400 animate-bounce'
                  : gameState === 'WON'
                  ? 'bg-emerald-400'
                  : gameState === 'LOST' || gameState === 'SLIPPING'
                  ? 'bg-red-400'
                  : 'bg-gray-400'
              }`}
            />
            <span className="font-semibold text-gray-200">{statusMessage}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400">Floors Stacked:</span>
            <span className="font-mono-numbers font-bold text-amber-300 bg-[#151b26] px-2.5 py-0.5 rounded-lg border border-[#242c3d]">
              {stackedFloors.length} Floors
            </span>
            <span className="font-mono-numbers font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/50">
              {currentMultiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* Interactive 4K Canvas Container */}
        <div className="relative bg-[#070b12] border-2 border-[#242c3d] rounded-2xl overflow-hidden shadow-2xl">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onClick={() => {
              if (gameState === 'PLAYING') handleDropFloor();
            }}
            className={`w-full h-[400px] sm:h-[480px] lg:h-[540px] block ${
              gameState === 'PLAYING' ? 'cursor-pointer active:brightness-95' : 'cursor-default'
            }`}
            style={{ touchAction: 'none' }}
          />

          {/* Interactive Tap Hint Overlay on Screen */}
          {gameState === 'PLAYING' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none bg-black/60 backdrop-blur-md border border-amber-400/60 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-amber-300 shadow-xl animate-pulse">
              <ArrowDown className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>TAP ANYWHERE ON SCREEN TO DROP COTTAGE FLOOR</span>
            </div>
          )}

          {/* Winning Celebration Modal Overlay */}
          {gameState === 'WON' && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <Crown className="w-9 h-9 text-emerald-300 animate-bounce" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-white mb-1">
                VICTORY! CASHED OUT!
              </h2>
              <p className="text-gray-300 text-sm max-w-sm mb-4">
                You successfully stacked <span className="text-amber-300 font-bold">{stackedFloors.length} cottage floors</span> and cashed out before slipping!
              </p>
              <div className="bg-[#121622] border-2 border-emerald-500/60 rounded-2xl p-4 px-8 mb-5 shadow-2xl">
                <span className="text-xs uppercase font-bold text-gray-400 block mb-1">Total Payout Credited</span>
                <span className="font-mono-numbers text-3xl sm:text-4xl font-black text-emerald-400">
                  ₹{lastWinPayout.toLocaleString('en-IN')}
                </span>
                <span className="block text-xs text-yellow-300 font-bold mt-1">
                  Multiplier: {currentMultiplier.toFixed(2)}x &bull; Profit: +₹{(lastWinPayout - wager).toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={handleStartGame}
                disabled={!currentUser || currentUser.balance < wager}
                className="py-3 px-8 rounded-xl font-black text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.5)] cursor-pointer active:scale-95 transition-all uppercase tracking-wider text-sm flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>START NEXT CLIMB (₹{wager})</span>
              </button>
            </div>
          )}

          {/* Loss Modal Overlay (Immediate retry with zero lag) */}
          {gameState === 'LOST' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                <RotateCcw className="w-8 h-8 text-red-400 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-red-400 mb-1">
                TOWER COLLAPSED!
              </h2>
              <p className="text-gray-300 text-sm max-w-sm mb-4">
                The floor misaligned and slipped off the edge into the abyss! All progress was lost.
              </p>
              <div className="bg-[#121622] border-2 border-red-500/40 rounded-2xl p-4 px-8 mb-5">
                <span className="text-xs uppercase font-bold text-gray-400 block mb-1">Wager Lost</span>
                <span className="font-mono-numbers text-2xl sm:text-3xl font-black text-red-400">
                  -₹{lossAmount}
                </span>
              </div>
              <button
                onClick={handleStartGame}
                disabled={!currentUser || currentUser.balance < wager}
                className="py-3 px-8 rounded-xl font-black text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.5)] cursor-pointer active:scale-95 transition-all uppercase tracking-wider text-sm flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>TRY AGAIN INSTANTLY (₹{wager})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. MULTIPLIER & FLOOR PROFIT PREVIEW LADDER */}
      <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-3 px-4 overflow-x-auto">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-gray-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#d4af37]" />
            Upcoming Floor Returns (1 Rupee = 10 Paise on Floor 1):
          </span>
          <span className="text-[11px] text-gray-400">
            Current Floor: <strong className="text-amber-300">{stackedFloors.length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-max pb-1">
          {FLOOR_MULTIPLIERS.slice(0, 12).map((mult, i) => {
            const floorNum = i + 1;
            const isCompleted = stackedFloors.length >= floorNum;
            const isNext = stackedFloors.length + 1 === floorNum;
            const floorProfit = Number(((mult - 1.0) * wager).toFixed(2));

            return (
              <div
                key={floorNum}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl border text-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                    : isNext
                    ? 'bg-amber-500/20 border-amber-400 text-yellow-300 shadow-[0_0_12px_rgba(245,208,97,0.4)] ring-1 ring-amber-400'
                    : 'bg-[#121622] border-[#242c3d] text-gray-400 opacity-60'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Floor {floorNum}
                </span>
                <span className="font-mono-numbers text-xs font-black">
                  {mult.toFixed(2)}x
                </span>
                <span className="text-[9px] font-mono-numbers text-gray-400 mt-0.5">
                  +₹{floorProfit}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CONTROLS CONSOLE & ACTIONS */}
      <div className="bg-[#0e121a] border-2 border-[#d4af37]/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242c3d] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
              Tower Rush Crane Investment Console
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Available Demo Balance:</span>
            <span className="font-mono-numbers font-bold text-white bg-[#151b26] px-3 py-1 rounded-lg border border-[#242c3d]">
              ₹{currentUser?.balance || 0}
            </span>
          </div>
        </div>

        {/* DIFFICULTY SELECTOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-semibold">Select Crane Physics Challenge:</span>
            <span className="text-gray-400">{activeDifficulty.description}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['HARD', 'EXTREME', 'INSANE'] as CraneDifficulty[]).map(d => {
              const cfg = CRANE_DIFFICULTIES[d];
              return (
                <button
                  key={d}
                  type="button"
                  disabled={gameState === 'PLAYING' || gameState === 'FALLING'}
                  onClick={() => setDifficulty(d)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    difficulty === d
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black border-amber-300 font-black shadow-md'
                      : 'bg-[#151b26] hover:bg-[#242c3d] text-gray-300 border-[#242c3d] font-bold'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="text-xs tracking-wider">{cfg.name}</span>
                  <span
                    className={`text-[10px] font-mono-numbers mt-0.5 ${
                      difficulty === d ? 'text-black/80' : 'text-amber-400'
                    }`}
                  >
                    Tolerance: {(cfg.tolerancePercent * 100).toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PRIMARY ACTION BUTTONS & WAGER STEPPER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Bet Quantity Amount Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">
                Adjust Bet Investment Quantity:
              </span>
              <span className="text-[11px] text-gray-400">
                Min: ₹20 &bull; Max: ₹5,000
              </span>
            </div>

            {/* Stepper Input with [-] and [+] Quantity Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={gameState === 'PLAYING' || gameState === 'FALLING' || wager <= 20}
                onClick={() => adjustWager(-10)}
                title="Decrease by ₹10"
                className="w-11 h-11 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-gray-200 font-bold text-lg disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={20}
                  max={currentUser?.balance || 5000}
                  disabled={gameState === 'PLAYING' || gameState === 'FALLING'}
                  value={wager}
                  onChange={e => setWager(Math.max(20, parseInt(e.target.value, 10) || 20))}
                  className="w-full bg-[#121622] border-2 border-[#242c3d] focus:border-[#d4af37] rounded-xl pl-8 pr-4 py-2.5 text-base font-mono-numbers font-bold text-white focus:outline-none disabled:opacity-50 text-center"
                />
              </div>

              <button
                type="button"
                disabled={gameState === 'PLAYING' || gameState === 'FALLING' || wager >= (currentUser?.balance || 5000)}
                onClick={() => adjustWager(10)}
                title="Increase by ₹10"
                className="w-11 h-11 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-gray-200 font-bold text-lg disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                type="button"
                disabled={gameState === 'PLAYING' || gameState === 'FALLING' || wager >= (currentUser?.balance || 5000)}
                onClick={() => adjustWager(50)}
                title="Increase by ₹50"
                className="px-3 h-11 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-[#d4af37] font-mono-numbers font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                +₹50
              </button>
            </div>

            {/* Quick Bet Preset Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-gray-400 mr-1">Presets:</span>
              {QUICK_BETS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  disabled={gameState === 'PLAYING' || gameState === 'FALLING' || amt > (currentUser?.balance || 5000)}
                  onClick={() => setWager(amt)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono-numbers font-bold transition-all cursor-pointer ${
                    wager === amt
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black shadow-md'
                      : 'bg-[#151b26] hover:bg-[#242c3d] text-gray-300 border border-[#242c3d]'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* PRIMARY ACTION BUTTONS (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2.5 justify-center">
            {gameState === 'PLAYING' || gameState === 'FALLING' ? (
              <>
                {/* 1. Large Drop Floor Action Button */}
                <button
                  onClick={handleDropFloor}
                  disabled={gameState !== 'PLAYING'}
                  className="w-full py-4 rounded-xl font-black text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-[#d4af37] hover:from-yellow-300 hover:to-amber-400 shadow-[0_0_25px_rgba(245,208,97,0.5)] transition-all uppercase tracking-wider text-base flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="w-5 h-5 animate-bounce" />
                  <span>DROP COTTAGE FLOOR {nextFloorNumber}</span>
                </button>

                {/* 2. Cash Out Button (Enabled when >= 1 floor stacked) */}
                {stackedFloors.length > 0 ? (
                  <button
                    onClick={handleCashOut}
                    className="w-full py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <DollarSign className="w-5 h-5 text-emerald-100" />
                    <span>
                      CASH OUT ₹{potentialCashout.toLocaleString('en-IN')} ({currentMultiplier.toFixed(2)}x)
                    </span>
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl bg-[#151b26] border border-[#242c3d] text-center text-xs text-gray-400">
                    Stack Floor 1 to unlock Cash Out (+10% Profit)
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={handleStartGame}
                disabled={!currentUser || currentUser.balance < wager}
                className="w-full py-5 rounded-2xl font-black text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all uppercase tracking-wider text-base sm:text-lg flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 fill-black text-black" />
                  <span>START TOWER RUSH</span>
                </div>
                <span className="text-xs font-sans font-bold text-black/80 mt-0.5">
                  Wager ₹{wager} &bull; {activeDifficulty.name}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Live High-Roller Scoreboard */}
      <GameScoreboard gameType="TOWER_CLIMB" gameTitle="Tower Rush" />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/soundEffects';
import {
  Coins,
  Sparkles,
  DollarSign,
  Minus,
  Plus,
  TrendingUp,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Flame,
  Play,
  Zap,
  Trophy,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { GameScoreboard } from '../common/GameScoreboard';

// 4x4 Compact Grid (16 tiles total)
const TOTAL_TILES = 16;

// 1. Authentic 3D Bomb Graphic with Detonation & Spark Pulse
const CannonballGrenadeGraphic: React.FC<{ detonated?: boolean; size?: string }> = ({
  detonated,
  size = 'w-10 h-10',
}) => {
  if (detonated) {
    return (
      <div className="relative flex items-center justify-center animate-bounce">
        {/* Explosion Blast Aura */}
        <div className="absolute inset-0 bg-red-600/80 rounded-full blur-xl animate-ping pointer-events-none" />
        <div className="relative">
          <img
            src="/assets/aistudio/time_948d7842.png"
            alt="Detonated Bomb"
            className="w-12 h-12 object-contain drop-shadow-[0_0_25px_rgba(239,68,68,1)] filter brightness-125"
          />
          {/* BOOM Detonation Tag */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-black text-[10px] text-white bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 border border-yellow-300 px-2 py-0.5 rounded shadow-2xl uppercase tracking-wider animate-pulse">
              BOOM!
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center group">
      <img
        src="/assets/aistudio/time_948d7842.png"
        alt="3D Mine Bomb"
        className={`${size} object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)] filter group-hover:scale-105 transition-transform`}
      />
      {/* Animated spark pulse at the fuse tip */}
      <div className="absolute top-0 right-2 w-2 h-2 rounded-full bg-yellow-300 blur-[1px] animate-ping pointer-events-none" />
    </div>
  );
};

// 2. High-Fidelity 3D Golden Coin Graphic for Safe Tiles
const GoldenCoinGraphic: React.FC<{ size?: string; valueText?: string }> = ({
  size = 'w-11 h-11',
  valueText,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
      {/* Golden Radiance Aura */}
      <div className="absolute inset-0 bg-amber-400/35 rounded-full blur-md pointer-events-none" />

      {/* Minted Gold Coin SVG with 3D Bevel & Star Engraving */}
      <svg
        className={`${size} drop-shadow-[0_4px_12px_rgba(245,208,97,0.75)] filter transition-transform hover:scale-110`}
        viewBox="0 0 100 100"
        fill="none"
      >
        <defs>
          <radialGradient id="goldCoinFace" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff9c4" />
            <stop offset="25%" stopColor="#ffd700" />
            <stop offset="70%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8a5a00" />
          </radialGradient>
          <linearGradient id="goldCoinRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe57f" />
            <stop offset="50%" stopColor="#b8860b" />
            <stop offset="100%" stopColor="#543d04" />
          </linearGradient>
          <linearGradient id="starEmboss" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7a4f03" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Depth Shadow Base */}
        <circle cx="50" cy="53" r="46" fill="#3b2b04" />

        {/* Outer Milled Rim with Fine Ridges */}
        <circle cx="50" cy="50" r="46" fill="url(#goldCoinRim)" stroke="#ffe082" strokeWidth="1.5" />

        {/* Coin Face */}
        <circle cx="50" cy="50" r="40" fill="#6d4c06" />
        <circle cx="50" cy="50" r="38" fill="url(#goldCoinFace)" />

        {/* Inner Milled Dot Perimeter */}
        <circle
          cx="50"
          cy="50"
          r="33"
          stroke="#ffe57f"
          strokeWidth="1.2"
          strokeDasharray="3.5 3.5"
          fill="none"
          opacity="0.85"
        />

        {/* Center Embossed Star & Shine */}
        <polygon
          points="50,25 56,39 71,40 60,51 63,66 50,57 37,66 40,51 29,40 44,39"
          fill="url(#starEmboss)"
          stroke="#ffe082"
          strokeWidth="1"
        />
        <circle cx="50" cy="50" r="4.5" fill="#ffffff" opacity="0.8" />
      </svg>

      {/* Floating Multiplier Tag Under Coin */}
      {valueText && (
        <span className="font-mono-numbers font-black text-[9px] text-yellow-200 bg-black/85 px-1.5 py-0.5 rounded-md border border-amber-500/50 mt-1 shadow-md">
          {valueText}
        </span>
      )}
    </div>
  );
};

// Progressive multiplier calculation adjusted for heightened difficulty (0.95 casino factor)
export const calculateMinesMultiplier = (
  openedCoins: number,
  mines: number,
  totalTiles: number = TOTAL_TILES
): number => {
  if (openedCoins <= 0) return 1.0;

  const totalSafe = totalTiles - mines;
  if (openedCoins > totalSafe) openedCoins = totalSafe;

  // Probability-based multiplier compounding
  let mult = 1.0;
  for (let i = 0; i < openedCoins; i++) {
    const remainingTotal = totalTiles - i;
    const remainingSafe = totalSafe - i;
    if (remainingSafe <= 0) break;
    mult *= remainingTotal / remainingSafe;
  }

  // Tightened 95% RTP for higher challenge and riskier initial tiles
  const calculated = mult * 0.95;
  return Math.max(1.10, Number(calculated.toFixed(2)));
};

export const MinesGame: React.FC = () => {
  const { currentUser, recordGameRound } = useGame();

  // Configuration (Default 3 active mines on 16-tile grid)
  const [mineCount, setMineCount] = useState<number>(3);
  const [wager, setWager] = useState<number>(100);

  // Game State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set());
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<'WIN' | 'LOSS' | null>(null);
  const [hitMineIndex, setHitMineIndex] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Configure your bet & active mines below, then tap START GAME to launch!'
  );

  // Statistics for 16 tiles total
  const currentSafeCount = revealedTiles.size;
  const totalSafeTiles = TOTAL_TILES - mineCount;

  // Progressive Multiplier
  const currentMultiplier = useMemo(() => {
    return calculateMinesMultiplier(currentSafeCount, mineCount, TOTAL_TILES);
  }, [currentSafeCount, mineCount]);

  // Next coin multiplier preview
  const nextMultiplier = useMemo(() => {
    return calculateMinesMultiplier(currentSafeCount + 1, mineCount, TOTAL_TILES);
  }, [currentSafeCount, mineCount]);

  // Baseline 1st coin multiplier for display
  const baselineMultiplier = useMemo(() => {
    return calculateMinesMultiplier(1, mineCount, TOTAL_TILES);
  }, [mineCount]);

  const potentialCashout = Number((wager * currentMultiplier).toFixed(2));
  const nextPotentialCashout = Number((wager * nextMultiplier).toFixed(2));

  // Adjust wager helper
  const adjustWager = (delta: number) => {
    if (isPlaying) return;
    setWager(prev => {
      const next = prev + delta;
      return Math.max(20, Math.min(currentUser?.balance || 5000, next));
    });
  };

  // Fisher-Yates true random bomb positioning across all 16 tiles with NO safety cushion
  const generateRandomMines = (count: number, total: number): Set<number> => {
    const indices: number[] = Array.from({ length: total }, (_, i) => i);

    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    return new Set(indices.slice(0, count));
  };

  // Start round
  const handleStartGame = () => {
    if (!currentUser) return;
    if (currentUser.accountStatus === 'BLOCKED') {
      setStatusMessage('Account PERMANENTLY BLOCKED by administrator for policy violations.');
      return;
    }
    if (currentUser.accountStatus === 'FROZEN') {
      setStatusMessage('Account FROZEN: In-game betting is restricted pending security audit.');
      return;
    }
    if (currentUser.isSuspended || currentUser.accountStatus === 'SUSPENDED') {
      setStatusMessage('Account suspended by administrator. Cannot start round.');
      return;
    }
    if (currentUser.balance < wager) {
      setStatusMessage(`Insufficient balance. Your available balance is ₹${currentUser.balance.toLocaleString('en-IN')}.`);
      return;
    }

    // Place randomly positioned bombs across all 16 tiles (first tile is genuinely risky!)
    const randomizedMines = generateRandomMines(mineCount, TOTAL_TILES);

    setMinePositions(randomizedMines);
    setRevealedTiles(new Set());
    setHitMineIndex(null);
    setIsGameOver(false);
    setGameResult(null);
    setIsPlaying(true);
    setStatusMessage(
      `Round active! ${mineCount} active bombs armed across the compact 16-tile 4x4 grid. Pick carefully!`
    );
    sounds.chipClick();
  };

  // Click on a tile
  const handleTileClick = (index: number) => {
    if (!isPlaying) {
      setStatusMessage('Tap START GAME below to arm the grid and launch the round!');
      return;
    }

    if (isGameOver || revealedTiles.has(index)) return;

    if (minePositions.has(index)) {
      // BOMB DETONATED!
      setHitMineIndex(index);
      setIsGameOver(true);
      setIsPlaying(false);
      setGameResult('LOSS');
      setStatusMessage(`BOOM! Detonated lit bomb at Tile #${index + 1}! Lost ₹${wager.toLocaleString('en-IN')} credits.`);
      sounds.mineExplode();

      recordGameRound(
        'MINES_24X24',
        'Golden Coin Mines',
        wager,
        0,
        0,
        `Hit Bomb at tile #${index + 1} with ${mineCount} active mines (${currentSafeCount} coins found)`
      );
      return;
    }

    // Safe Coin Found!
    const newRevealed = new Set(revealedTiles);
    newRevealed.add(index);
    setRevealedTiles(newRevealed);
    sounds.gemReveal();

    const newSafeCount = newRevealed.size;
    const newMult = calculateMinesMultiplier(newSafeCount, mineCount, TOTAL_TILES);
    const newPotentialWin = Number((wager * newMult).toFixed(2));

    if (newSafeCount === totalSafeTiles) {
      // Cleared all safe coins!
      setIsGameOver(true);
      setIsPlaying(false);
      setGameResult('WIN');
      setStatusMessage(`VAULT CLEARED! Uncovered all ${totalSafeTiles} coins! Won ₹${newPotentialWin.toLocaleString('en-IN')} at ${newMult.toFixed(2)}x!`);
      sounds.cashOutWin();

      recordGameRound(
        'MINES_24X24',
        'Golden Coin Mines',
        wager,
        newMult,
        newPotentialWin,
        `Perfect clear of all ${totalSafeTiles} coins with ${mineCount} active mines!`
      );
    } else {
      setStatusMessage(
        `Coin revealed at Tile #${index + 1}! Multiplier raised to ${newMult.toFixed(2)}x (+₹${(newPotentialWin - potentialCashout).toFixed(0)}). Cash out or tap another tile!`
      );
    }
  };

  // Cash Out
  const handleCashOut = () => {
    if (!isPlaying || isGameOver || currentSafeCount === 0) return;

    setIsGameOver(true);
    setIsPlaying(false);
    setGameResult('WIN');
    setStatusMessage(`Cashed out successfully! Banked ₹${potentialCashout.toLocaleString('en-IN')} credits at ${currentMultiplier.toFixed(2)}x!`);
    sounds.cashOutWin();

    recordGameRound(
      'MINES_24X24',
      'Golden Coin Mines',
      wager,
      currentMultiplier,
      potentialCashout,
      `Cashed out after ${currentSafeCount} coins with ${mineCount} active mines`
    );
  };

  const QUICK_BETS = [20, 50, 100, 200, 500, 1000];
  const PRESET_MINES = [1, 2, 3, 4, 5, 7, 9, 12];

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Live Stats Bar */}
      <div className="bg-[#0e121a] border border-[#d4af37]/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border-2 border-[#d4af37]/60 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(245,158,11,0.35)] relative overflow-hidden group">
            <Coins className="w-7 h-7 text-[#f5d061] group-hover:scale-110 transition-transform" />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-400 blur-[1px] animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-wide">
                GOLDEN COIN MINES
              </h1>
            </div>
            <p className="text-xs text-gray-400">
              Compact 4x4 vault &bull; {mineCount} active bombs &bull; 16 tiles total &bull; Cash out anytime
            </p>
          </div>
        </div>

        {/* Live Multiplier, Next Coin & Potential Cashout */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-[#151b26] border border-[#242c3d] rounded-xl px-3 py-2 text-center min-w-[80px]">
            <span className="text-[10px] text-gray-400 block uppercase font-semibold">Coins Found</span>
            <span className="font-mono-numbers text-base sm:text-lg font-black text-emerald-400">
              {currentSafeCount} / {totalSafeTiles}
            </span>
          </div>

          <div className="bg-[#151b26] border border-[#242c3d] rounded-xl px-3 py-2 text-center min-w-[90px]">
            <span className="text-[10px] text-gray-400 block uppercase font-semibold">Multiplier</span>
            <span className="font-mono-numbers text-base sm:text-lg font-black text-[#f5d061]">
              {currentMultiplier.toFixed(2)}x
            </span>
          </div>

          <div className="bg-[#151b26] border border-[#242c3d] rounded-xl px-3.5 py-2 text-center min-w-[110px]">
            <span className="text-[10px] text-gray-400 block uppercase font-semibold">Potential Win</span>
            <span className="font-mono-numbers text-base sm:text-lg font-black text-emerald-400">
              ₹{potentialCashout.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. COMPACT 4x4 MINES ARENA (16 TILES) */}
      <div className="space-y-3">
        {/* Status Message Ribbon */}
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPlaying ? 'bg-amber-400 animate-ping' : isGameOver ? 'bg-red-400' : 'bg-emerald-400'
              }`}
            />
            <span className="text-gray-200 font-semibold">{statusMessage}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>Baseline Multiplier:</span>
            <span className="font-mono-numbers text-[#f5d061] font-bold bg-[#151b26] px-2.5 py-0.5 rounded border border-[#242c3d]">
              {baselineMultiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* 16-TILES COMPACT CONTAINER (4 Cols x 4 Rows Grid) */}
        <div className="bg-[#080b11] border-2 border-[#242c3d] rounded-3xl p-4 sm:p-6 shadow-2xl relative">
          <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto">
            {Array.from({ length: TOTAL_TILES }).map((_, idx) => {
              const isRevealed = revealedTiles.has(idx);
              const isMine = minePositions.has(idx);
              const isDetonatedMine = hitMineIndex === idx;
              const showMinePostGame = isGameOver && isMine;
              const showCoinPostGame = isGameOver && !isMine && !isRevealed;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isGameOver || isRevealed}
                  onClick={() => handleTileClick(idx)}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer relative shadow-lg ${
                    isRevealed
                      ? 'bg-gradient-to-br from-amber-950/80 via-[#231804] to-amber-950/80 border-amber-400 shadow-[0_0_20px_rgba(245,208,97,0.4)] scale-100'
                      : isDetonatedMine
                      ? 'bg-gradient-to-br from-red-950 via-red-900 to-black border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.9)] animate-shake'
                      : showMinePostGame
                      ? 'bg-[#181114] border-red-900/60 opacity-80'
                      : showCoinPostGame
                      ? 'bg-[#151510] border-amber-900/40 opacity-50'
                      : isPlaying
                      ? 'bg-gradient-to-br from-[#151b26] via-[#10141d] to-[#0c0f17] border-[#242c3d] hover:border-[#d4af37] hover:scale-105 active:scale-95 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'bg-[#121622] border-[#1e2535] hover:border-[#d4af37]/70 hover:scale-105 active:scale-95'
                  }`}
                >
                  {/* Revealed State: Golden Coin, Detonated Bomb, or Unrevealed Tile */}
                  {isRevealed ? (
                    <GoldenCoinGraphic size="w-9 h-9 sm:w-11 sm:h-11" valueText="COIN" />
                  ) : isDetonatedMine ? (
                    <CannonballGrenadeGraphic detonated={true} />
                  ) : showMinePostGame ? (
                    <div className="flex flex-col items-center justify-center">
                      <CannonballGrenadeGraphic size="w-7 h-7 sm:w-9 sm:h-9" />
                      <span className="text-[8px] font-mono-numbers text-red-400 uppercase font-bold mt-0.5">
                        BOMB
                      </span>
                    </div>
                  ) : showCoinPostGame ? (
                    <div className="flex flex-col items-center justify-center opacity-70">
                      <Coins className="w-6 h-6 text-yellow-500/70" />
                      <span className="text-[7px] text-yellow-500 uppercase mt-0.5 font-bold">COIN</span>
                    </div>
                  ) : (
                    /* Hidden Unclicked State */
                    <div className="flex flex-col items-center justify-center select-none group">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1b2230] border border-[#2d384d] flex items-center justify-center shadow-inner group-hover:border-[#d4af37] transition-colors">
                        <span className="text-[11px] font-mono-numbers font-bold text-gray-300 group-hover:text-amber-300">
                          {idx + 1}
                        </span>
                      </div>
                      <span className="text-[8px] text-gray-500 font-mono mt-1 uppercase tracking-wider group-hover:text-gray-300">
                        VAULT
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Outcome Alert */}
        {isGameOver && (
          <div
            className={`p-4 rounded-2xl border text-center font-cinzel text-sm sm:text-base font-bold animate-in fade-in duration-300 ${
              gameResult === 'WIN'
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.35)]'
                : 'bg-red-950/70 border-red-500/60 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
            }`}
          >
            {gameResult === 'WIN' ? (
              <div className="space-y-1">
                <p className="text-lg text-emerald-400 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span>Victory! You Won ₹{potentialCashout.toLocaleString('en-IN')}</span>
                </p>
                <p className="text-xs text-gray-300 font-sans">
                  Successfully uncovered {currentSafeCount} golden coin tiles! Multiplier locked: {currentMultiplier.toFixed(2)}x.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-lg text-red-400 flex items-center justify-center gap-2">
                  <Flame className="w-5 h-5 text-red-400 animate-bounce" />
                  <span>Bomb Detonated! Round Over</span>
                </p>
                <p className="text-xs text-gray-300 font-sans">
                  Wager of ₹{wager.toLocaleString('en-IN')} lost. Adjust your bet and active mines below to launch another round!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. CONTROLS DECK: CUSTOMIZE BET AMOUNT & NUMBER OF ACTIVE MINES */}
      <div className="bg-[#0e121a] border-2 border-[#d4af37]/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242c3d] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
              Customize Bet &amp; Active Mines
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Available Credits:</span>
            <span className="font-mono-numbers font-bold text-white bg-[#151b26] px-3 py-1 rounded-lg border border-[#242c3d]">
              ₹{(currentUser?.balance || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Primary Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Bet Amount Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">
                Bet Amount Customization:
              </span>
              <span className="text-[11px] text-gray-400">
                Min: ₹20 &bull; Max: ₹5,000
              </span>
            </div>

            {/* Stepper with [-] and [+] */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPlaying || wager <= 20}
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
                  disabled={isPlaying}
                  value={wager}
                  onChange={e => setWager(Math.max(20, parseInt(e.target.value, 10) || 20))}
                  className="w-full bg-[#121622] border-2 border-[#242c3d] focus:border-[#d4af37] rounded-xl pl-8 pr-4 py-2.5 text-base font-mono-numbers font-bold text-white focus:outline-none disabled:opacity-50 text-center"
                />
              </div>

              <button
                type="button"
                disabled={isPlaying || wager >= (currentUser?.balance || 5000)}
                onClick={() => adjustWager(10)}
                title="Increase by ₹10"
                className="w-11 h-11 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-gray-200 font-bold text-lg disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                type="button"
                disabled={isPlaying || wager >= (currentUser?.balance || 5000)}
                onClick={() => adjustWager(50)}
                title="Increase by ₹50"
                className="px-3 h-11 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-[#f5d061] font-mono-numbers font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                +50
              </button>
            </div>

            {/* Quick Bet Chips & Ratio Modifiers */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_BETS.map(b => (
                <button
                  key={b}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => setWager(b)}
                  className={`flex-1 min-w-[48px] py-1.5 px-2 rounded-xl text-xs font-mono-numbers font-bold transition-all cursor-pointer disabled:opacity-40 ${
                    wager === b
                      ? 'bg-[#d4af37] text-black border border-yellow-200 shadow-md'
                      : 'bg-[#151b26] hover:bg-[#242c3d] text-gray-300 border border-[#242c3d]'
                  }`}
                >
                  ₹{b}
                </button>
              ))}
              <button
                type="button"
                disabled={isPlaying}
                onClick={() => setWager(prev => Math.min(currentUser?.balance || 5000, prev * 2))}
                className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-[#151b26] hover:bg-[#242c3d] text-gray-300 border border-[#242c3d] disabled:opacity-40 cursor-pointer"
              >
                2x
              </button>
              <button
                type="button"
                disabled={isPlaying}
                onClick={() => setWager(prev => Math.max(20, Math.floor(prev / 2)))}
                className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-[#151b26] hover:bg-[#242c3d] text-gray-300 border border-[#242c3d] disabled:opacity-40 cursor-pointer"
              >
                1/2
              </button>
            </div>
          </div>

          {/* Action Trigger / Cash Out Button (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {!isPlaying ? (
              <button
                onClick={() => handleStartGame()}
                disabled={!currentUser || currentUser.balance < wager}
                className="w-full py-5 rounded-2xl font-black text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all uppercase tracking-wider text-base sm:text-lg flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current text-black" />
                  <span>START GAME</span>
                </div>
                <span className="text-xs font-sans font-bold text-black/80 mt-0.5">
                  Wager ₹{wager} &bull; {mineCount} Active Mines
                </span>
              </button>
            ) : (
              <button
                onClick={handleCashOut}
                disabled={currentSafeCount === 0}
                className="w-full py-5 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all uppercase tracking-wider text-base sm:text-lg flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-emerald-100" />
                  <span>CASH OUT</span>
                </div>
                <span className="font-mono-numbers text-xl font-black text-yellow-200 mt-0.5">
                  ₹{potentialCashout.toLocaleString('en-IN')} ({currentMultiplier.toFixed(2)}x)
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ACTIVE MINES CUSTOMIZATION DECK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#242c3d]">
          {/* Active Mines Count Slider & Stepper */}
          <div className="bg-[#121622] rounded-xl p-3.5 border border-[#242c3d] space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>Active Mines:</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-numbers text-xs font-bold text-red-400 px-2.5 py-0.5 rounded bg-[#151b26] border border-red-500/30">
                  {mineCount} of 16 Mines
                </span>
              </div>
            </div>

            {/* Stepper + Range slider */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPlaying || mineCount <= 1}
                onClick={() => setMineCount(prev => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-lg bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] text-gray-200 font-bold flex items-center justify-center text-xs disabled:opacity-40 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min={1}
                max={14}
                disabled={isPlaying}
                value={mineCount}
                onChange={e => setMineCount(parseInt(e.target.value, 10))}
                className="flex-1 accent-[#d4af37] bg-gray-700 h-2 rounded-lg cursor-pointer disabled:opacity-50"
              />

              <button
                type="button"
                disabled={isPlaying || mineCount >= 14}
                onClick={() => setMineCount(prev => Math.min(14, prev + 1))}
                className="w-8 h-8 rounded-lg bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] text-gray-200 font-bold flex items-center justify-center text-xs disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_MINES.map(m => (
                <button
                  key={m}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => setMineCount(m)}
                  className={`flex-1 py-1 rounded-lg text-xs font-mono-numbers font-bold transition-all cursor-pointer ${
                    mineCount === m
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow border border-red-400'
                      : 'bg-[#151b26] text-gray-400 hover:text-white border border-[#242c3d]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Odds & Progressive Multiplier Analytics */}
          <div className="bg-[#121622] rounded-xl p-3.5 border border-[#242c3d] grid grid-cols-3 gap-2 text-xs font-mono-numbers text-center items-center">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase">1st Coin Baseline</span>
              <span className="font-bold text-[#f5d061] text-sm">
                {baselineMultiplier.toFixed(2)}x
              </span>
              <span className="text-[9px] text-gray-500 block">Guaranteed</span>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 block uppercase">Safe Coins</span>
              <span className="font-bold text-emerald-400 text-sm">
                {totalSafeTiles} on field
              </span>
              <span className="text-[9px] text-emerald-400/80 block">
                {(((16 - mineCount) / 16) * 100).toFixed(0)}% Safe Odds
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 block uppercase">Blast Hazard</span>
              <span className="font-bold text-red-400 text-sm">
                {mineCount} Bombs
              </span>
              <span className="text-[9px] text-red-400/80 block">
                {((mineCount / 16) * 100).toFixed(0)}% Bomb Density
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Live High-Roller Scoreboard */}
      <GameScoreboard gameType="MINES_24X24" gameTitle="Golden Coin Mines" />
    </div>
  );
};

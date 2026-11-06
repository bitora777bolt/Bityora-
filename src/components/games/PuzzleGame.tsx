import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/soundEffects';
import {
  Grid,
  Sparkles,
  TrendingUp,
  DollarSign,
  RotateCcw,
  Zap,
  Award,
  Lock,
  Unlock,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Minus,
  Plus,
} from 'lucide-react';
import { GameScoreboard } from '../common/GameScoreboard';

type GemType = 'DIAMOND' | 'CROWN' | 'COIN' | 'RUBY' | 'CLOVER';

interface GemTile {
  id: number;
  type: GemType;
  icon: string;
  color: string;
}

const GEM_CONFIGS: Record<GemType, { icon: string; color: string; label: string }> = {
  DIAMOND: { icon: '💎', color: 'from-cyan-400 to-blue-600', label: 'Diamond' },
  CROWN: { icon: '👑', color: 'from-amber-300 to-yellow-600', label: 'Royal Crown' },
  COIN: { icon: '🪙', color: 'from-yellow-400 to-amber-700', label: 'Gold Ingot' },
  RUBY: { icon: '♦️', color: 'from-red-400 to-rose-700', label: 'Ruby' },
  CLOVER: { icon: '🍀', color: 'from-emerald-400 to-green-700', label: 'Lucky Clover' },
};

const GEM_KEYS: GemType[] = ['DIAMOND', 'CROWN', 'COIN', 'RUBY', 'CLOVER'];

const GRID_SIZE = 4; // 4x4 puzzle grid = 16 tiles

function createRandomGrid(): GemTile[] {
  return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, idx) => {
    const randomType = GEM_KEYS[Math.floor(Math.random() * GEM_KEYS.length)];
    return {
      id: idx,
      type: randomType,
      icon: GEM_CONFIGS[randomType].icon,
      color: GEM_CONFIGS[randomType].color,
    };
  });
}

export const PuzzleGame: React.FC = () => {
  const { currentUser, recordGameRound } = useGame();

  // Wager: Minimum 20 points, Big Bet 100 points
  const [wager, setWager] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [grid, setGrid] = useState<GemTile[]>(createRandomGrid());
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [movesLeft, setMovesLeft] = useState<number>(5);
  const [matchesCount, setMatchesCount] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Invest points to solve the Diamond Vault Puzzle. Match 3 gems to unlock 3.0x (+2 more points per point invested)!'
  );

  // Start new puzzle round
  const handleStartPuzzle = () => {
    if (!currentUser) return;
    if (currentUser.isSuspended) {
      setStatusMessage('Account suspended by administrator. Cannot play.');
      return;
    }
    if (wager < 20) {
      setStatusMessage('Minimum bet requirement is 20 points.');
      return;
    }
    if (currentUser.balance < wager) {
      setStatusMessage(`Insufficient points. Your balance is ${currentUser.balance} points.`);
      return;
    }

    setGrid(createRandomGrid());
    setSelectedTileIndex(null);
    setMovesLeft(5);
    setMatchesCount(0);
    setCurrentMultiplier(1.0);
    setIsPlaying(true);
    setIsGameOver(false);
    sounds.chipClick();
    setStatusMessage('Puzzle active! Click two adjacent gems to swap them. Make rows or columns of 3 identical gems!');
  };

  // Check and process matches on the 4x4 grid
  const checkMatches = (currentGrid: GemTile[]) => {
    const matchedIndices = new Set<number>();

    // Horizontal check
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const idx1 = r * GRID_SIZE + c;
        const idx2 = r * GRID_SIZE + c + 1;
        const idx3 = r * GRID_SIZE + c + 2;
        if (
          currentGrid[idx1].type === currentGrid[idx2].type &&
          currentGrid[idx2].type === currentGrid[idx3].type
        ) {
          matchedIndices.add(idx1);
          matchedIndices.add(idx2);
          matchedIndices.add(idx3);
        }
      }
    }

    // Vertical check
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const idx1 = r * GRID_SIZE + c;
        const idx2 = (r + 1) * GRID_SIZE + c;
        const idx3 = (r + 2) * GRID_SIZE + c;
        if (
          currentGrid[idx1].type === currentGrid[idx2].type &&
          currentGrid[idx2].type === currentGrid[idx3].type
        ) {
          matchedIndices.add(idx1);
          matchedIndices.add(idx2);
          matchedIndices.add(idx3);
        }
      }
    }

    return matchedIndices;
  };

  // Tile click / swap handler
  const handleTileClick = (index: number) => {
    if (!isPlaying || isGameOver || movesLeft <= 0) return;

    if (selectedTileIndex === null) {
      // First selection
      setSelectedTileIndex(index);
      sounds.chipClick();
      return;
    }

    if (selectedTileIndex === index) {
      // Deselect
      setSelectedTileIndex(null);
      return;
    }

    // Check adjacency (horizontal or vertical on 4x4)
    const r1 = Math.floor(selectedTileIndex / GRID_SIZE);
    const c1 = selectedTileIndex % GRID_SIZE;
    const r2 = Math.floor(index / GRID_SIZE);
    const c2 = index % GRID_SIZE;

    const isAdjacent = (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);

    if (!isAdjacent) {
      // Switch selection
      setSelectedTileIndex(index);
      sounds.chipClick();
      return;
    }

    // Swap tiles
    const newGrid = [...grid];
    const temp = newGrid[selectedTileIndex];
    newGrid[selectedTileIndex] = newGrid[index];
    newGrid[index] = temp;

    const matches = checkMatches(newGrid);

    if (matches.size > 0) {
      // Successful match!
      sounds.puzzleMatch();
      const updatedMatchesCount = matchesCount + 1;
      setMatchesCount(updatedMatchesCount);

      // Multiplier formula:
      // 1st match: 1.5x
      // 2nd match: 2.0x (Double Points)
      // 3rd match: 3.0x (Invest points & get 2 more points per point!)
      // 4th match: 5.0x
      // 5th match: 10.0x Mega Vault Jackpot!
      let newMult = 1.5;
      if (updatedMatchesCount === 2) newMult = 2.0;
      else if (updatedMatchesCount === 3) newMult = 3.0;
      else if (updatedMatchesCount === 4) newMult = 5.0;
      else if (updatedMatchesCount >= 5) newMult = 10.0;

      setCurrentMultiplier(newMult);

      // Replace matched tiles with fresh random gems
      matches.forEach(idx => {
        const randType = GEM_KEYS[Math.floor(Math.random() * GEM_KEYS.length)];
        newGrid[idx] = {
          id: idx + Math.random(),
          type: randType,
          icon: GEM_CONFIGS[randType].icon,
          color: GEM_CONFIGS[randType].color,
        };
      });

      setGrid(newGrid);
      const remainingMoves = movesLeft - 1;
      setMovesLeft(remainingMoves);
      setSelectedTileIndex(null);

      if (newMult >= 3.0) {
        setStatusMessage(
          `VAULT CIPHER UNLOCKED! Reached ${newMult}x multiplier! You can Cash Out now or keep solving for higher multipliers!`
        );
      } else {
        setStatusMessage(
          `Match found! Current Multiplier: ${newMult}x (${remainingMoves} moves left). Solve more matches to hit 3.0x (+2 pts)!`
        );
      }

      if (remainingMoves <= 0) {
        // Auto cash out at current multiplier
        handleCashOut(newMult);
      }
    } else {
      // Invalid swap - give visual cue and consume move
      const remainingMoves = movesLeft - 1;
      setMovesLeft(remainingMoves);
      setSelectedTileIndex(null);
      setStatusMessage(`No match found on that swap. ${remainingMoves} moves left.`);
      sounds.wheelTick();

      if (remainingMoves <= 0) {
        if (currentMultiplier > 1.0) {
          handleCashOut(currentMultiplier);
        } else {
          // Round lost
          setIsGameOver(true);
          setIsPlaying(false);
          sounds.mineExplode();
          setStatusMessage(`Out of moves without unlocking the vault. Lost ${wager} points.`);

          recordGameRound(
            'VAULT_PUZZLE',
            'Diamond Vault Cipher Puzzle',
            wager,
            0,
            0,
            'No matches completed within 5 moves'
          );
        }
      }
    }
  };

  // Cash Out
  const handleCashOut = (multOverride?: number) => {
    if (!isPlaying && !isGameOver) return;

    const mult = multOverride || currentMultiplier;
    const payout = Number((wager * mult).toFixed(2));
    const profit = payout - wager;

    setIsGameOver(true);
    setIsPlaying(false);
    sounds.cashOutWin();

    if (mult >= 3.0) {
      setStatusMessage(
        `SUCCESSFUL VAULT SOLVE! Cashed out ${payout} points at ${mult}x! Earned +${profit} points profit (Invested ${wager} & got 2+ more points per point)!`
      );
    } else {
      setStatusMessage(`Cashed out successfully! Banked ${payout} points at ${mult}x!`);
    }

    recordGameRound(
      'VAULT_PUZZLE',
      'Diamond Vault Cipher Puzzle',
      wager,
      mult,
      payout,
      `Solved ${matchesCount} puzzle matches. Final Multiplier: ${mult}x`
    );
  };

  // Adjust wager quantity helper
  const adjustWager = (delta: number) => {
    if (isPlaying) return;
    setWager(prev => {
      const next = prev + delta;
      return Math.max(20, Math.min(100, next));
    });
  };

  // Preset bets respecting min 20 and big bet 100
  const BET_PRESETS = [
    { label: 'Min (20)', value: 20 },
    { label: '40', value: 40 },
    { label: '60', value: 60 },
    { label: '80', value: 80 },
    { label: 'Big Bet (100)', value: 100, isBig: true },
  ];

  const potentialCashout = Number((wager * currentMultiplier).toFixed(2));

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Stats */}
      <div className="bg-[#0e121a] border border-[#d4af37]/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-lg">
            <Grid className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                Diamond Vault Puzzle
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                CIPHER MATCH &bull; 3.0X VAULT UNLOCK
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Min Bet: <strong>20 Pts</strong> &bull; Big Bet: <strong>100 Pts</strong> &bull; Match gems to solve the vault
            </p>
          </div>
        </div>

        {/* Current State Badges */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-[#151b26] border border-[#242c3d] rounded-xl px-3.5 py-2 text-center min-w-[80px]">
            <span className="text-[10px] text-gray-400 block uppercase font-semibold">Moves Left</span>
            <span className="font-mono-numbers text-base sm:text-lg font-black text-white">
              {isPlaying ? movesLeft : 5}
            </span>
          </div>

          <div className="bg-[#151b26] border border-[#242c3d] rounded-xl px-3.5 py-2 text-center min-w-[90px]">
            <span className="text-[10px] text-gray-400 block uppercase font-semibold">Matches</span>
            <span className="font-mono-numbers text-base sm:text-lg font-black text-[#f5d061]">
              {matchesCount} / 3
            </span>
          </div>

          <div className="bg-[#151b26] border border-[#242c3d] rounded-xl px-3.5 py-2 text-center min-w-[100px]">
            <span className="text-[10px] text-gray-400 block uppercase font-semibold">Multiplier</span>
            <span className="font-mono-numbers text-base sm:text-lg font-black text-emerald-400">
              {currentMultiplier.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>

      {/* 2. TOP SECTION: 4x4 PUZZLE MATRIX (PLAY ARENA) */}
      <div className="bg-[#090c12] border-2 border-[#242c3d] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center justify-center relative">
        <div className="w-full max-w-[440px] space-y-4">
          {/* Vault Status Indicator */}
          <div className="flex items-center justify-between border-b border-[#242c3d] pb-3">
            <div className="flex items-center gap-2">
              {matchesCount >= 3 ? (
                <Unlock className="w-5 h-5 text-emerald-400 animate-bounce" />
              ) : (
                <Lock className="w-5 h-5 text-amber-400" />
              )}
              <span className="font-cinzel text-xs font-bold text-white uppercase tracking-wider">
                {matchesCount >= 3 ? 'Vault Unlocked (3.0x Achieved)' : 'Cipher Locked (Target: 3 Matches)'}
              </span>
            </div>
            <span className="font-mono-numbers text-xs text-gray-400">
              Moves: <strong className="text-white">{movesLeft}</strong>
            </span>
          </div>

          {/* 4x4 Interactive Tile Grid */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
            {grid.map((tile, idx) => {
              const isSelected = selectedTileIndex === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isPlaying || isGameOver}
                  onClick={() => handleTileClick(idx)}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer relative shadow-lg ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-105'
                      : 'border-[#242c3d] bg-[#121622] hover:border-[#d4af37]/60 hover:bg-[#182030] active:scale-95'
                  } disabled:cursor-default`}
                >
                  <span className="text-2xl sm:text-3xl select-none filter drop-shadow">
                    {tile.icon}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono mt-0.5 hidden sm:inline">
                    {GEM_CONFIGS[tile.type].label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* End Game Banner */}
          {isGameOver && (
            <div
              className={`mt-4 p-3 rounded-xl border text-center text-xs font-bold animate-in fade-in duration-300 ${
                currentMultiplier >= 3.0
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : currentMultiplier > 1.0
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                  : 'bg-red-950/80 border-red-500/60 text-red-300'
              }`}
            >
              {currentMultiplier > 1.0 ? (
                <p>
                  Round Complete! Multiplier: <strong>{currentMultiplier.toFixed(1)}x</strong> &bull; Banked{' '}
                  <strong>{potentialCashout} Points</strong>!
                </p>
              ) : (
                <p>Round Over without matches. Start a new puzzle to try again!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM SECTION: CONTROLS & POINT QUANTITY ADJUSTMENTS (DIRECTLY UNDERNEATH) */}
      <div className="bg-[#0e121a] border-2 border-[#d4af37]/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Point Investment Rule Box */}
        <div className="bg-gradient-to-r from-[#0d1624] to-[#121c2d] border border-cyan-500/35 rounded-xl p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Invest Points &amp; Get +2 More Points: 3 matches unlock 3.0x vault profit!</span>
          </div>
          <span className="text-[11px] text-gray-400">
            Available: <strong>{currentUser?.balance || 0} Pts</strong>
          </span>
        </div>

        {/* PRIMARY ACTION BUTTON & QUANTITY CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Point Quantity Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">
                Adjust Bet Quantity:
              </span>
              <span className="text-[11px] text-gray-400">
                Min: 20 Pts &bull; Big Bet: 100 Pts
              </span>
            </div>

            {/* Stepper with [-] and [+] Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPlaying || wager <= 20}
                onClick={() => adjustWager(-10)}
                title="Decrease by 10 points"
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
                  max={Math.min(100, currentUser?.balance || 100)}
                  disabled={isPlaying}
                  value={wager}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10) || 20;
                    setWager(Math.max(20, Math.min(100, val)));
                  }}
                  className="w-full bg-[#121622] border-2 border-[#242c3d] focus:border-cyan-400 rounded-xl pl-8 pr-4 py-2.5 text-base font-mono-numbers font-bold text-white focus:outline-none disabled:opacity-50 text-center"
                />
              </div>

              <button
                type="button"
                disabled={isPlaying || wager >= Math.min(100, currentUser?.balance || 100)}
                onClick={() => adjustWager(10)}
                title="Increase by 10 points"
                className="w-11 h-11 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-gray-200 font-bold text-lg disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                type="button"
                disabled={isPlaying || wager >= 100}
                onClick={() => setWager(100)}
                title="Set to Big Bet 100"
                className="px-3 h-11 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono-numbers font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                Big 100
              </button>
            </div>

            {/* Presets: Min 20, 40, 60, 80, Big Bet 100 */}
            <div className="flex flex-wrap gap-1.5">
              {BET_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => setWager(preset.value)}
                  className={`flex-1 min-w-[50px] py-1.5 px-2 rounded-xl text-xs font-mono-numbers font-bold transition-all cursor-pointer disabled:opacity-40 ${
                    wager === preset.value
                      ? 'bg-cyan-500 text-black border border-cyan-300 shadow-md'
                      : preset.isBig
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-[#151b26] border border-[#242c3d] text-gray-300 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Start or Cash Out (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {!isPlaying ? (
              <button
                onClick={handleStartPuzzle}
                disabled={!currentUser || currentUser.balance < wager}
                className="w-full py-5 rounded-2xl font-black text-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-blue-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all uppercase tracking-wider text-base sm:text-lg flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-black" />
                  <span>START PUZZLE</span>
                </div>
                <span className="text-xs font-sans font-bold text-black/80 mt-0.5">
                  Invest {wager} Points
                </span>
              </button>
            ) : (
              <button
                onClick={() => handleCashOut()}
                disabled={currentMultiplier <= 1.0}
                className="w-full py-5 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all uppercase tracking-wider text-base sm:text-lg flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-emerald-100" />
                  <span>CASH OUT</span>
                </div>
                <span className="font-mono-numbers text-xl font-black text-yellow-200 mt-0.5">
                  {potentialCashout} Points ({currentMultiplier.toFixed(1)}x)
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Multiplier Ladder Progress & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#242c3d]">
          <div className="bg-[#121622] rounded-xl p-3 border border-[#242c3d] space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Vault Cipher Multipliers:
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-center font-mono-numbers">
              <div
                className={`p-1.5 rounded-lg border ${
                  matchesCount >= 1 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-[#151b26] text-gray-500 border-[#242c3d]'
                }`}
              >
                <span className="block text-[10px]">1 Match</span>
                <span className="font-bold">1.5x</span>
              </div>
              <div
                className={`p-1.5 rounded-lg border ${
                  matchesCount >= 2 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-[#151b26] text-gray-500 border-[#242c3d]'
                }`}
              >
                <span className="block text-[10px]">2 Matches</span>
                <span className="font-bold">2.0x</span>
              </div>
              <div
                className={`p-1.5 rounded-lg border ${
                  matchesCount >= 3 ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-sm' : 'bg-[#151b26] text-gray-500 border-[#242c3d]'
                }`}
              >
                <span className="block text-[10px]">3 Matches</span>
                <span className="font-bold text-[#f5d061]">3.0x (+2 pts)</span>
              </div>
              <div
                className={`p-1.5 rounded-lg border ${
                  matchesCount >= 4 ? 'bg-purple-500/30 text-purple-300 border-purple-500/50' : 'bg-[#151b26] text-gray-500 border-[#242c3d]'
                }`}
              >
                <span className="block text-[10px]">4+ Matches</span>
                <span className="font-bold text-purple-300">5.0x - 10x</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121622] rounded-xl p-3 border border-[#242c3d] text-xs text-gray-300 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-0.5">Puzzle Guide</p>
              <p className="text-gray-400 leading-relaxed">{statusMessage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live High-Roller Scoreboard */}
      <GameScoreboard gameType="VAULT_PUZZLE" gameTitle="Diamond Vault" />
    </div>
  );
};

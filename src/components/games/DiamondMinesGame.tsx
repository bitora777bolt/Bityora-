import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { GameScoreboard } from '../common/GameScoreboard';
import { sounds } from '../../utils/soundEffects';
import {
  Coins,
  Gem,
  Skull,
  Trophy,
  AlertCircle,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface TileState {
  index: number;
  revealed: boolean;
  isMine: boolean;
}

export const DiamondMinesGame: React.FC = () => {
  const { currentUser, recordGameRound, soundEnabled } = useGame();

  const [wager, setWager] = useState<number>(50);
  const [mineCount, setMineCount] = useState<number>(5);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [tiles, setTiles] = useState<TileState[]>(() =>
    Array.from({ length: 25 }, (_, i) => ({ index: i, revealed: false, isMine: false }))
  );
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [lastWin, setLastWin] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [explodedIdx, setExplodedIdx] = useState<number | null>(null);

  const userBalance = currentUser?.balance || 0;

  // Multiplier calculation for 5x5 grid with guaranteed 1.10x baseline
  const calculateMultiplier = (revealed: number, mines: number): number => {
    if (revealed === 0) return 1.0;
    let mult = 1.0;
    for (let i = 0; i < revealed; i++) {
      mult *= (25 - i) / (25 - mines - i);
    }
    const step1Theoretical = (25 / (25 - mines)) * 0.985;
    const baselineBoost = Math.max(0, 1.10 - step1Theoretical);
    const calculated = mult * 0.985 + baselineBoost * Math.pow(0.9, revealed - 1);
    return Math.max(1.10, Number(calculated.toFixed(2)));
  };

  const nextMultiplier = calculateMultiplier(revealedCount + 1, mineCount);

  const startNewGame = () => {
    setErrorMsg('');
    setLastWin(0);
    setGameOver(false);
    setExplodedIdx(null);

    if (wager <= 0) {
      setErrorMsg('Please select a valid wager amount!');
      return;
    }

    if (wager > userBalance) {
      setErrorMsg(`Insufficient credits! Your available balance is ₹${userBalance}.`);
      if (soundEnabled) sounds.playBomb();
      return;
    }

    // Place random mines among 25 tiles
    const mineIndices = new Set<number>();
    while (mineIndices.size < mineCount) {
      const r = Math.floor(Math.random() * 25);
      mineIndices.add(r);
    }

    const initialTiles: TileState[] = Array.from({ length: 25 }, (_, i) => ({
      index: i,
      revealed: false,
      isMine: mineIndices.has(i),
    }));

    setTiles(initialTiles);
    setRevealedCount(0);
    setCurrentMultiplier(1.0);
    setGameActive(true);

    if (soundEnabled) sounds.playClick();
  };

  const handleTileClick = (index: number) => {
    if (!gameActive || tiles[index].revealed || gameOver) return;

    const clickedTile = tiles[index];

    if (clickedTile.isMine) {
      // BOOM! Hit a mine
      setExplodedIdx(index);
      setGameActive(false);
      setGameOver(true);

      // Reveal all mines
      setTiles((prev) =>
        prev.map((t) => (t.isMine ? { ...t, revealed: true } : t))
      );

      recordGameRound('DIAMOND_MINES', 'Diamond Mines', wager, 0, 0, `Hit Mine at Tile ${index + 1}`);
      if (soundEnabled) sounds.playBomb();
    } else {
      // Safe Diamond Found!
      const newRevealed = revealedCount + 1;
      const newMult = calculateMultiplier(newRevealed, mineCount);

      setTiles((prev) =>
        prev.map((t) => (t.index === index ? { ...t, revealed: true } : t))
      );
      setRevealedCount(newRevealed);
      setCurrentMultiplier(newMult);

      if (soundEnabled) sounds.playWin();

      // Check if all safe diamonds found
      if (newRevealed === 25 - mineCount) {
        // Automatic full board clear cashout!
        handleCashout(newMult);
      }
    }
  };

  const handleCashout = (overrideMult?: number) => {
    if (!gameActive && !overrideMult) return;

    const mult = overrideMult || currentMultiplier;
    const payout = Math.round(wager * mult);

    setGameActive(false);
    setGameOver(true);
    setLastWin(payout);

    // Reveal rest of board
    setTiles((prev) => prev.map((t) => ({ ...t, revealed: true })));

    recordGameRound(
      'DIAMOND_MINES',
      'Diamond Mines',
      wager,
      mult,
      payout,
      `Cashed out ${revealedCount} Diamonds at ${mult}x`
    );

    if (soundEnabled) {
      if (mult >= 5) sounds.playBigWin();
      else sounds.playCashout();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0b0e17] border border-cyan-500/40 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Ambient */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#242c3d]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 flex items-center justify-center text-2xl shadow-lg border border-cyan-300/40 text-white">
              💎
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-wide gold-text-gradient">
                  DIAMOND MINES
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                  5x5 VAULT GRID
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Play with Credits &bull; Uncover Sparkling Diamonds &bull; Cash Out Anytime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#131826] border border-[#242c3d] px-4 py-2 rounded-2xl">
            <Coins className="w-4 h-4 text-[#f5d061]" />
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Credits Balance</p>
              <p className="text-base font-black text-white font-mono-numbers">
                ₹{userBalance.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="my-5 flex flex-wrap items-center justify-between gap-3 bg-[#070a12] border border-[#242c3d] p-3 sm:p-4 rounded-2xl">
          <div className="flex items-center gap-4 text-xs font-mono-numbers">
            <div>
              <span className="text-gray-400">Mines: </span>
              <strong className="text-rose-400 font-bold">{mineCount}</strong>
            </div>
            <div>
              <span className="text-gray-400">Gems Found: </span>
              <strong className="text-cyan-400 font-bold">{revealedCount} / {25 - mineCount}</strong>
            </div>
            <div>
              <span className="text-gray-400">Current Multiplier: </span>
              <strong className="text-emerald-400 font-bold text-sm">{currentMultiplier}X</strong>
            </div>
          </div>

          {gameActive && (
            <div className="text-xs font-mono-numbers text-right">
              <span className="text-gray-400">Next Diamond: </span>
              <strong className="text-[#f5d061] font-bold">{nextMultiplier}X</strong>
            </div>
          )}
        </div>

        {/* 5x5 Mine Grid */}
        <div className="max-w-md mx-auto my-6">
          <div className="grid grid-cols-5 gap-2 sm:gap-3 bg-[#080b14] p-3 sm:p-4 rounded-3xl border border-[#242c3d] shadow-inner">
            {tiles.map((tile) => {
              const isExploded = explodedIdx === tile.index;

              return (
                <button
                  key={tile.index}
                  disabled={!gameActive || tile.revealed || gameOver}
                  onClick={() => handleTileClick(tile.index)}
                  className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 select-none relative overflow-hidden ${
                    !tile.revealed
                      ? 'bg-[#151d2c] hover:bg-[#1e2a3e] border border-[#2a364d] shadow-md hover:scale-105 active:scale-95 cursor-pointer'
                      : tile.isMine
                      ? isExploded
                        ? 'bg-red-600 border-2 border-red-400 animate-ping shadow-[0_0_25px_rgba(239,68,68,0.8)]'
                        : 'bg-red-950/70 border border-red-700/50 text-red-400'
                      : 'bg-gradient-to-br from-cyan-600/30 to-blue-700/40 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-100'
                  }`}
                >
                  {tile.revealed ? (
                    tile.isMine ? (
                      <div className="relative flex items-center justify-center">
                        <img
                          src="/assets/aistudio/time_948d7842.png"
                          alt="3D Mine Bomb"
                          className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse"
                        />
                      </div>
                    ) : (
                      <Gem className="w-6 h-6 text-cyan-300 animate-bounce" />
                    )
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/20" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Win Banner */}
        {lastWin > 0 && (
          <div className="max-w-md mx-auto mb-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-black py-2.5 px-4 rounded-2xl text-center flex items-center justify-center gap-2 shadow-xl animate-bounce">
            <Trophy className="w-5 h-5 text-amber-300" />
            <span>Diamond Cashout Win: +₹{lastWin.toLocaleString('en-IN')}!</span>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="max-w-md mx-auto mb-4 bg-red-500/20 border border-red-500/40 text-red-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Controls: Mine Count & Bet Amount */}
        <div className="max-w-lg mx-auto space-y-4">
          {!gameActive ? (
            <>
              {/* Mine count selector */}
              <div className="bg-[#121622] border border-[#242c3d] p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Select Mines Count:</span>
                  <strong className="text-rose-400 font-bold">{mineCount} Mines</strong>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 2, 3, 5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setMineCount(count)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        mineCount === count
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-[#182030] text-gray-300 hover:text-white'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bet presets */}
              <div className="bg-[#121622] border border-[#242c3d] p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Wager Points:</span>
                  <span className="font-mono-numbers font-bold text-white">₹{wager}</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[10, 25, 50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setWager(amt)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        wager === amt
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-md'
                          : 'bg-[#182030] text-gray-300 hover:text-white'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <button
                disabled={userBalance < wager}
                onClick={startNewGame}
                className="w-full py-4 rounded-2xl font-black text-base text-black bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-400 hover:brightness-110 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer active:scale-98"
              >
                START GAME (₹{wager})
              </button>
            </>
          ) : (
            /* Cashout Button */
            <button
              disabled={revealedCount === 0}
              onClick={() => handleCashout()}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                revealedCount === 0
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 text-black hover:brightness-110 animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.5)]'
              }`}
            >
              <span>CASH OUT NOW (₹{Math.round(wager * currentMultiplier)} • {currentMultiplier}X)</span>
            </button>
          )}
        </div>
      </div>

      <GameScoreboard gameType="DIAMOND_MINES" gameTitle="Diamond Mines" />
    </div>
  );
};

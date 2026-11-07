import React, { useState, useEffect } from 'react';
import { MinesGame } from './MinesGame';
import { ChickenRoadGame } from './ChickenRoadGame';
import { AviatorGame } from './AviatorGame';
import { FortuneGame } from './FortuneGame';
import { PuzzleGame } from './PuzzleGame';
import { TowerGame } from './TowerGame';
import { TradingGame } from './TradingGame';
import { FortuneTigerGame } from './FortuneTigerGame';
import { RouletteGame } from './RouletteGame';
import { MatkaPokerGame } from './MatkaPokerGame';
import { DiamondMinesGame } from './DiamondMinesGame';
import { CandyBonanzaGame } from './CandyBonanzaGame';
import { MiningRushGame } from './MiningRushGame';
import { LuxuryGameIcon } from '../common/LuxuryGameIcons';
import { RoyalMegaLottery } from '../lottery/RoyalMegaLottery';
import { useGame } from '../../context/GameContext';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Flame,
  ChevronRight,
  Coins,
  Ticket,
  Lock,
  Play,
} from 'lucide-react';

export type GameKey =
  | 'mining_rush'
  | 'aviator'
  | 'mines'
  | 'diamond_mines'
  | 'roulette'
  | 'fortune_tiger'
  | 'matka_poker'
  | 'candy_bonanza'
  | 'tower'
  | 'trading'
  | 'chicken'
  | 'fortune'
  | 'puzzle';

interface GamesHubProps {
  initialGame?: GameKey | null;
  onBackToLobby?: () => void;
  onRequireAuth?: (gameId: GameKey, gameTitle: string) => void;
}

interface GameCardInfo {
  id: GameKey;
  title: string;
  category: string;
  categoryTag: 'all' | 'crash' | 'slots' | 'table' | 'mines';
  badge: string;
  badgeColor: string;
  accentBorder: string;
  accentBg: string;
  glowColor: string;
  playBtnGradient: string;
  iconArt: React.ReactNode;
}

export const GamesHub: React.FC<GamesHubProps> = ({
  initialGame = null,
  onBackToLobby,
  onRequireAuth,
}) => {
  const { currentUser } = useGame();
  const [activeGame, setActiveGame] = useState<GameKey | null>(initialGame);
  const [filterCategory, setFilterCategory] = useState<'all' | 'crash' | 'slots' | 'table' | 'mines'>('all');
  const [showLotterySection, setShowLotterySection] = useState<boolean>(true);

  // Sync if initialGame prop changes externally
  useEffect(() => {
    if (initialGame !== undefined) {
      setActiveGame(initialGame);
    }
  }, [initialGame]);

  const handleOpenGame = (gameId: GameKey) => {
    const game = gamesList.find((g) => g.id === gameId);
    if (!currentUser) {
      if (onRequireAuth) {
        onRequireAuth(gameId, game?.title || 'Casino Game');
      }
      return;
    }
    setActiveGame(gameId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToLobby = () => {
    setActiveGame(null);
    if (onBackToLobby) {
      onBackToLobby();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // High-Definition, Original 3D Expensive Luxury Casino Icons for all games
  const gamesList: GameCardInfo[] = [
    {
      id: 'mining_rush',
      title: 'MINING RUSH',
      category: 'Diamond Cavern Excavator',
      categoryTag: 'mines',
      badge: '1000X RUSH',
      badgeColor: 'bg-amber-500/20 text-yellow-300 border border-amber-400/40',
      accentBorder: 'border-amber-400/50 hover:border-yellow-400',
      accentBg: 'from-[#2b160a] via-[#1a0e06] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]',
      playBtnGradient: 'from-amber-500 via-yellow-400 to-amber-600 text-black font-black',
      iconArt: <LuxuryGameIcon gameId="mining_rush" size="md" />,
    },
    {
      id: 'aviator',
      title: 'AVIATOR',
      category: 'Supersonic Monoplane',
      categoryTag: 'crash',
      badge: '1000X MAX',
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/40',
      accentBorder: 'border-red-500/40 hover:border-red-500',
      accentBg: 'from-[#2b080d] via-[#1a0a10] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]',
      playBtnGradient: 'from-red-600 via-rose-600 to-amber-600 text-white',
      iconArt: <LuxuryGameIcon gameId="aviator" size="md" />,
    },
    {
      id: 'mines',
      title: 'GOLDEN MINES',
      category: 'Coins & Bombs',
      categoryTag: 'mines',
      badge: '4x4 GRID',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      accentBorder: 'border-emerald-500/40 hover:border-emerald-400',
      accentBg: 'from-[#0b2416] via-[#0e1c15] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]',
      playBtnGradient: 'from-emerald-500 via-teal-500 to-[#d4af37] text-black font-black',
      iconArt: <LuxuryGameIcon gameId="mines" size="md" />,
    },
    {
      id: 'fortune_tiger',
      title: 'FORTUNE TIGER',
      category: 'Imperial 24K Gold Slot',
      categoryTag: 'slots',
      badge: '500X STREAK',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      accentBorder: 'border-amber-500/40 hover:border-amber-400',
      accentBg: 'from-[#2b1206] via-[#1a0e06] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]',
      playBtnGradient: 'from-amber-400 via-red-500 to-yellow-500 text-black font-black',
      iconArt: <LuxuryGameIcon gameId="fortune_tiger" size="md" />,
    },
    {
      id: 'roulette',
      title: 'ROULETTE',
      category: 'European 37 Pockets',
      categoryTag: 'table',
      badge: '36X POCKET',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      accentBorder: 'border-emerald-500/40 hover:border-emerald-400',
      accentBg: 'from-[#0b2416] via-[#0d1c15] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]',
      playBtnGradient: 'from-emerald-500 via-teal-500 to-[#d4af37] text-black font-black',
      iconArt: <LuxuryGameIcon gameId="roulette" size="md" />,
    },
    {
      id: 'matka_poker',
      title: 'MATKA POKER',
      category: 'Single Ank & Teen Patti',
      categoryTag: 'table',
      badge: '9X ANK • 50X',
      badgeColor: 'bg-amber-500/20 text-[#f5d061] border border-amber-500/40',
      accentBorder: 'border-amber-500/40 hover:border-amber-400',
      accentBg: 'from-[#2b1f06] via-[#1a1406] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(245,208,97,0.4)]',
      playBtnGradient: 'from-amber-400 via-yellow-400 to-[#d4af37] text-black font-black',
      iconArt: <LuxuryGameIcon gameId="matka_poker" size="md" />,
    },
    {
      id: 'diamond_mines',
      title: 'DIAMOND MINES',
      category: '5x5 Vault Grid',
      categoryTag: 'mines',
      badge: '5x5 GRID',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
      accentBorder: 'border-cyan-500/40 hover:border-cyan-400',
      accentBg: 'from-[#07202c] via-[#091620] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]',
      playBtnGradient: 'from-cyan-400 via-blue-500 to-teal-400 text-black font-black',
      iconArt: <LuxuryGameIcon gameId="diamond_mines" size="md" />,
    },
    {
      id: 'candy_bonanza',
      title: 'CANDY BONANZA',
      category: 'Sweet Cascade',
      categoryTag: 'slots',
      badge: '100X BOMBS',
      badgeColor: 'bg-pink-500/20 text-pink-300 border border-pink-500/40',
      accentBorder: 'border-pink-500/40 hover:border-pink-400',
      accentBg: 'from-[#2b0720] via-[#1a0815] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(236,72,153,0.4)]',
      playBtnGradient: 'from-pink-500 via-rose-500 to-purple-600 text-white font-black',
      iconArt: <LuxuryGameIcon gameId="candy_bonanza" size="md" />,
    },
    {
      id: 'chicken',
      title: 'CHICKEN ROAD',
      category: '10 Hazard Lanes',
      categoryTag: 'crash',
      badge: '65X MULT',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
      accentBorder: 'border-yellow-500/40 hover:border-yellow-400',
      accentBg: 'from-[#2b2005] via-[#1a1506] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(234,179,8,0.35)]',
      playBtnGradient: 'from-amber-400 via-yellow-400 to-orange-500 text-black font-black',
      iconArt: <LuxuryGameIcon gameId="chicken" size="md" />,
    },
    {
      id: 'tower',
      title: 'TOWER RUSH',
      category: 'Crane Cottage Stacking',
      categoryTag: 'crash',
      badge: 'CRANE STACK',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      accentBorder: 'border-amber-500/40 hover:border-amber-400',
      accentBg: 'from-[#2a1a08] via-[#1c1308] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]',
      playBtnGradient: 'from-amber-400 via-yellow-400 to-[#d4af37] text-black font-black',
      iconArt: <LuxuryGameIcon gameId="tower" size="md" />,
    },
    {
      id: 'fortune',
      title: 'MAYA FORTUNE WHEEL',
      category: '25-Spin Grand Jackpot',
      categoryTag: 'table',
      badge: '25-SPIN 250X',
      badgeColor: 'bg-amber-500/20 text-[#f5d061] border border-amber-400/40',
      accentBorder: 'border-amber-400/40 hover:border-amber-400',
      accentBg: 'from-[#0b2416] via-[#1b1506] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(245,208,97,0.35)]',
      playBtnGradient: 'from-amber-400 via-[#d4af37] to-[#aa820a] text-black font-black',
      iconArt: <LuxuryGameIcon gameId="fortune" size="md" />,
    },
    {
      id: 'trading',
      title: 'CRYPTO RUN',
      category: 'Live Candlesticks',
      categoryTag: 'crash',
      badge: 'LIVE BTC/INR',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
      accentBorder: 'border-teal-500/40 hover:border-teal-400',
      accentBg: 'from-[#08221c] via-[#0b1716] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(20,184,166,0.35)]',
      playBtnGradient: 'from-emerald-400 via-teal-500 to-cyan-500 text-black font-black',
      iconArt: <LuxuryGameIcon gameId="trading" size="md" />,
    },
    {
      id: 'puzzle',
      title: 'VAULT PUZZLE',
      category: '4x4 Diamond Cipher',
      categoryTag: 'slots',
      badge: '10X CIPHER',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40',
      accentBorder: 'border-cyan-500/40 hover:border-cyan-400',
      accentBg: 'from-[#071f2b] via-[#091520] to-[#0c0e15]',
      glowColor: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]',
      playBtnGradient: 'from-cyan-400 via-blue-500 to-indigo-600 text-white font-black',
      iconArt: <LuxuryGameIcon gameId="puzzle" size="md" />,
    },
  ];

  const filteredGames = filterCategory === 'all'
    ? gamesList
    : gamesList.filter((g) => g.categoryTag === filterCategory);

  const activeGameData = gamesList.find((g) => g.id === activeGame);

  // If a game is active: Render ONLY that single game with a prominent top back bar
  if (activeGame && activeGameData) {
    if (!currentUser) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0c0f17] border border-[#242c3d] p-3 sm:p-4 rounded-2xl">
            <button
              onClick={handleReturnToLobby}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#171d2b] hover:bg-[#222a3d] border border-[#d4af37]/50 text-[#f5d061] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to All Games</span>
            </button>
            <span className="text-xs font-bold text-amber-400 font-mono">🔒 AUTHENTICATION REQUIRED</span>
          </div>

          <div className="rounded-3xl bg-gradient-to-b from-[#181c2b] via-[#0f131f] to-[#07090e] border-2 border-[#d4af37]/60 p-8 sm:p-14 text-center space-y-6 shadow-[0_0_60px_rgba(212,175,55,0.25)]">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-[#d4af37] flex items-center justify-center mx-auto text-[#f5d061] shadow-[0_0_30px_rgba(212,175,55,0.4)]">
              <Lock className="w-10 h-10 text-[#f5d061]" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#f5d061] bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full">
                MANDATORY ACCESS GATE
              </span>
              <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-white">
                SIGN IN OR REGISTER TO PLAY {activeGameData.title}
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                You must sign in or register before you can access or play {activeGameData.title}. All verified new accounts instantly receive a fixed <strong className="text-[#f5d061]">110 Credits Welcome Bonus</strong>!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onRequireAuth ? onRequireAuth(activeGame, activeGameData.title) : null}
                className="py-3.5 px-8 rounded-xl font-black text-black bg-gradient-to-r from-amber-400 via-[#f5d061] to-yellow-500 hover:brightness-110 shadow-[0_0_30px_rgba(212,175,55,0.4)] text-xs sm:text-sm uppercase tracking-wider cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY NOW &bull; SIGN IN / REGISTER (+110 CREDITS)</span>
              </button>
              <button
                onClick={handleReturnToLobby}
                className="py-3.5 px-6 rounded-xl font-bold text-gray-400 hover:text-white bg-[#121622] border border-[#242c3d] text-xs sm:text-sm cursor-pointer"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Sleek Top Bar with Back Button & Real-Time Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#0c0f17] via-[#121622] to-[#0c0f17] border border-[#242c3d] p-3 sm:p-4 rounded-2xl shadow-xl">
          <button
            onClick={handleReturnToLobby}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#171d2b] hover:bg-[#222a3d] border border-[#d4af37]/50 text-[#f5d061] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>← Back to All Games</span>
          </button>

          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
            {/* Unified Single Winnings Balance Column */}
            <div className="bg-[#131826] border border-[#d4af37]/40 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-inner">
              <Coins className="w-4 h-4 text-[#f5d061]" />
              <div>
                <p className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">Balance</p>
                <p className="font-mono-numbers text-xs sm:text-sm font-black text-[#f5d061]">
                  ₹{currentUser?.balance.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 border-l border-[#242c3d] pl-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-right">
                <h2 className="font-cinzel font-black text-white text-sm sm:text-base tracking-wider uppercase">
                  {activeGameData.title}
                </h2>
                <p className="text-[10px] text-gray-400 font-medium">
                  {activeGameData.category}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Game Component */}
        <div>
          {activeGame === 'mining_rush' && <MiningRushGame />}
          {activeGame === 'fortune_tiger' && <FortuneTigerGame />}
          {activeGame === 'roulette' && <RouletteGame />}
          {activeGame === 'matka_poker' && <MatkaPokerGame />}
          {activeGame === 'diamond_mines' && <DiamondMinesGame />}
          {activeGame === 'candy_bonanza' && <CandyBonanzaGame />}
          {activeGame === 'aviator' && <AviatorGame />}
          {activeGame === 'mines' && <MinesGame />}
          {activeGame === 'tower' && <TowerGame />}
          {activeGame === 'trading' && <TradingGame />}
          {activeGame === 'chicken' && <ChickenRoadGame />}
          {activeGame === 'fortune' && <FortuneGame />}
          {activeGame === 'puzzle' && <PuzzleGame />}
        </div>
      </div>
    );
  }

  // SINGLE-PAGE DENSE GAME LOBBY
  return (
    <div className="space-y-6">
      {/* 1. Lobby Top Header */}
      <div className="bg-gradient-to-r from-[#10141f] via-[#141926] to-[#0c0f17] border border-[#242c3d] p-3.5 sm:p-5 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#f5d061] via-[#d4af37] to-[#8c7322] flex items-center justify-center text-black font-cinzel font-black text-xl sm:text-2xl shadow-lg">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cinzel text-lg sm:text-2xl font-black text-white tracking-wide">
                GAMES LOBBY
              </h1>
              <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f5d061]">
                {gamesList.length} 3D GAMES
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-[#f5d061] font-bold bg-[#131826] border border-[#d4af37]/40 px-3 py-1 rounded-lg shadow-inner">
                <Coins className="w-3.5 h-3.5 text-[#f5d061]" />
                <span>Winnings Balance: ₹{currentUser?.balance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1 bg-[#090b10] border border-[#242c3d] p-1 rounded-2xl overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All 12 Games' },
            { id: 'crash', label: 'Crash' },
            { id: 'slots', label: 'Slots' },
            { id: 'table', label: 'Table' },
            { id: 'mines', label: 'Mines' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ROYAL MEGA LOTTERY & ₹5 CRORE BUMPER JACKPOT (Tempting Allure) */}
      {showLotterySection && <RoyalMegaLottery />}

      {/* 3. CONTINUOUS SCROLLABLE DENSE GRID (5 to 6 cols desktop, 3 to 4 tablet, 2 mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            onClick={() => handleOpenGame(game.id)}
            className={`group relative rounded-2xl bg-gradient-to-b ${game.accentBg} border ${game.accentBorder} p-3 sm:p-3.5 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 ${game.glowColor} cursor-pointer flex flex-col justify-between overflow-hidden shadow-lg`}
          >
            {/* Top Multiplier Tag & Live Indicator */}
            <div className="relative z-10 flex items-center justify-between mb-1">
              <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full ${game.badgeColor}`}>
                {game.badge}
              </span>
              {!currentUser ? (
                <span className="text-[8px] font-bold text-amber-300 bg-black/80 border border-amber-500/40 px-1 py-0.5 rounded-md flex items-center gap-0.5">
                  <Lock className="w-2 h-2 text-amber-400" />
                  <span>Locked</span>
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>

            {/* Handcrafted 3D Luxury Graphic Icon */}
            <div className="relative z-10 my-1 flex items-center justify-center">
              {game.iconArt}
            </div>

            {/* Bottom: Clean Title, Category & Compact Play Button */}
            <div className="relative z-10 pt-1 space-y-1.5 text-center">
              <div>
                <h3 className="font-cinzel text-xs sm:text-sm font-black text-white group-hover:text-[#f5d061] transition-colors truncate">
                  {game.title}
                </h3>
                <p className="text-[10px] text-gray-400 font-medium truncate">
                  {game.category}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenGame(game.id);
                }}
                className={`w-full py-1.5 sm:py-2 rounded-xl text-[11px] font-black bg-gradient-to-r ${game.playBtnGradient} shadow-sm flex items-center justify-center gap-1 group-hover:shadow-md transition-all cursor-pointer active:scale-95`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>PLAY NOW</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

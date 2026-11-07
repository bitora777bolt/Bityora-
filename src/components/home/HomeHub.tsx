import React from 'react';
import { useGame } from '../../context/GameContext';
import { LuxuryGameIcon } from '../common/LuxuryGameIcons';
import { RoyalMegaLottery } from '../lottery/RoyalMegaLottery';
import {
  Coins,
  QrCode,
  Shield,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  CheckCircle,
  Play,
  Lock,
} from 'lucide-react';

interface HomeHubProps {
  onSelectTab: (tab: string) => void;
  onOpenCashier: () => void;
  onRequireAuth?: (targetTab: string, gameTitle?: string) => void;
}

export const HomeHub: React.FC<HomeHubProps> = ({ onSelectTab, onOpenCashier, onRequireAuth }) => {
  const { currentUser } = useGame();

  const handlePlayNow = (gameTab: string, gameTitle: string) => {
    if (!currentUser) {
      if (onRequireAuth) {
        onRequireAuth(gameTab, gameTitle);
      } else {
        onSelectTab(gameTab);
      }
      return;
    }
    onSelectTab(gameTab);
  };

  const gamesFeatured = [
    {
      id: 'mining_rush',
      tab: 'games_mining_rush',
      title: 'MINING RUSH',
      category: 'Diamond Cavern Excavator',
      badge: '1000X RUSH',
      border: 'border-amber-400/50 hover:border-yellow-400',
      bg: 'from-[#2b160a] via-[#1a0e06] to-[#0c0e15]',
      btnGrad: 'from-amber-500 via-yellow-400 to-amber-600 text-black font-black',
    },
    {
      id: 'aviator',
      tab: 'games_aviator',
      title: 'ORIGINAL AVIATOR',
      category: 'Supersonic Monoplane',
      badge: '1000X JACKPOT',
      border: 'border-red-500/40 hover:border-red-400',
      bg: 'from-[#2b080d] via-[#1a0a10] to-[#0c0e15]',
      btnGrad: 'from-red-600 via-rose-600 to-amber-600 text-white',
    },
    {
      id: 'mines',
      tab: 'games_mines',
      title: '24-TILE MINES',
      category: 'Grenades & Clovers',
      badge: '24 TILES',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      bg: 'from-[#0b2416] via-[#0e1c15] to-[#0c0e15]',
      btnGrad: 'from-emerald-500 via-teal-500 to-[#d4af37] text-black font-black',
    },
    {
      id: 'fortune_tiger',
      tab: 'games_fortune_tiger',
      title: 'FORTUNE TIGER',
      category: 'Imperial 24K Gold Slot',
      badge: '500X STREAK',
      border: 'border-amber-500/40 hover:border-amber-400',
      bg: 'from-[#2b1206] via-[#1a0e06] to-[#0c0e15]',
      btnGrad: 'from-amber-400 via-red-500 to-yellow-500 text-black font-black',
    },
    {
      id: 'roulette',
      tab: 'games_roulette',
      title: 'EUROPEAN ROULETTE',
      category: '37 Pockets & Gold Chips',
      badge: '36X POCKET',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      bg: 'from-[#0b2416] via-[#0d1c15] to-[#0c0e15]',
      btnGrad: 'from-emerald-500 via-teal-500 to-[#d4af37] text-black font-black',
    },
    {
      id: 'matka_poker',
      tab: 'games_matka_poker',
      title: 'MATKA POKER',
      category: 'Single Ank & Teen Patti',
      badge: '50X TRIO',
      border: 'border-amber-500/40 hover:border-amber-400',
      bg: 'from-[#2b1f06] via-[#1a1406] to-[#0c0e15]',
      btnGrad: 'from-amber-400 via-yellow-400 to-[#d4af37] text-black font-black',
    },
    {
      id: 'diamond_mines',
      tab: 'games_diamond_mines',
      title: 'DIAMOND MINES',
      category: '5x5 Diamond Vault',
      badge: '5x5 VAULT',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      bg: 'from-[#07202c] via-[#091620] to-[#0c0e15]',
      btnGrad: 'from-cyan-400 via-blue-500 to-teal-400 text-black font-black',
    },
    {
      id: 'candy_bonanza',
      tab: 'games_candy_bonanza',
      title: 'CANDY BONANZA',
      category: 'Sweet Cascade & Bombs',
      badge: '100X BOMBS',
      border: 'border-pink-500/40 hover:border-pink-400',
      bg: 'from-[#2b0720] via-[#1a0815] to-[#0c0e15]',
      btnGrad: 'from-pink-500 via-rose-500 to-purple-600 text-white font-black',
    },
    {
      id: 'chicken',
      tab: 'games_chicken',
      title: 'CHICKEN ROAD',
      category: '10 Highway Hazard Lanes',
      badge: '65X MULT',
      border: 'border-yellow-500/40 hover:border-yellow-400',
      bg: 'from-[#2b2005] via-[#1a1506] to-[#0c0e15]',
      btnGrad: 'from-amber-400 via-yellow-400 to-orange-500 text-black font-black',
    },
    {
      id: 'tower',
      tab: 'games_tower',
      title: 'TOWER RUSH',
      category: 'Crane Cottage Stacking',
      badge: 'CRANE STACK',
      border: 'border-amber-500/40 hover:border-amber-400',
      bg: 'from-[#2a1a08] via-[#1c1308] to-[#0c0e15]',
      btnGrad: 'from-amber-400 via-yellow-400 to-[#d4af37] text-black font-black',
    },
    {
      id: 'fortune',
      tab: 'games_fortune',
      title: 'MAYA FORTUNE WHEEL',
      category: '25-Spin Grand Jackpot',
      badge: '25-SPIN 250X',
      border: 'border-amber-400/40 hover:border-amber-400',
      bg: 'from-[#0b2416] via-[#1b1506] to-[#0c0e15]',
      btnGrad: 'from-amber-400 via-[#d4af37] to-[#aa820a] text-black font-black',
    },
    {
      id: 'trading',
      tab: 'games_trading',
      title: 'CRYPTO TRADING',
      category: 'Live Candlesticks',
      badge: 'LIVE BTC/INR',
      border: 'border-teal-500/40 hover:border-teal-400',
      bg: 'from-[#08221c] via-[#0b1716] to-[#0c0e15]',
      btnGrad: 'from-emerald-400 via-teal-500 to-cyan-500 text-black font-black',
    },
    {
      id: 'puzzle',
      tab: 'games_puzzle',
      title: 'VAULT PUZZLE',
      category: 'Bank Vault Cipher',
      badge: '10X CIPHER',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      bg: 'from-[#071f2b] via-[#091520] to-[#0c0e15]',
      btnGrad: 'from-cyan-400 via-blue-500 to-indigo-600 text-white font-black',
    },
  ];

  return (
    <div className="space-y-10 py-2 sm:py-4">
      {/* 1. Opulent Hero Section with Gold Radiance */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#161a29] via-[#0e121a] to-[#07090e] border-2 border-[#d4af37]/45 p-6 sm:p-12 overflow-hidden shadow-[0_0_70px_rgba(212,175,55,0.2)]">
        {/* Decorative Golden Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#d4af37]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-amber-500/15 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f5d061] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OPULENT HIGH-ROLLER GAMING &bull; 100% UNIFIED WINNINGS</span>
          </div>

          <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            THE PINNACLE OF <br />
            <span className="gold-text-gradient drop-shadow-[0_4px_25px_rgba(212,175,55,0.4)]">
              WEALTH &amp; HIGH-ROLLER PLAY
            </span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
            Welcome to <strong className="text-white font-cinzel">BITORA</strong>. Experience ultra-luxury gaming featuring our supersonic <strong>Aviator 1000X flight deck</strong>, tactical <strong>24-Tile Grenade Mines</strong>, <strong>Fortune Tiger</strong>, and the <strong>Royal Mega Bumper Lottery</strong>. Powered by a single unified Winnings Balance with zero balance caps.
          </p>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handlePlayNow('games', 'All 12 Casino Games')}
              className="py-3.5 px-6 rounded-xl font-black text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>PLAY NOW &bull; ALL 12 GAMES</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectTab('deposit')}
              className="py-3.5 px-6 rounded-xl font-black text-black bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-110 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Coins className="w-4 h-4 text-black" />
              <span>+ Deposit (₹110 - ₹5,000)</span>
            </button>

            <button
              onClick={onOpenCashier}
              className="py-3.5 px-6 rounded-xl font-bold text-[#f5d061] bg-[#151b26] hover:bg-[#1f2838] border border-[#d4af37]/40 transition-all text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>Wallet &amp; Instant Refill</span>
            </button>
          </div>

          {/* Platform Trust & Policy Badges */}
          <div className="pt-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-400 font-mono-numbers">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" /> Single Unified Winnings Balance
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <Shield className="w-3.5 h-3.5" /> No Balance Limits &bull; Deposit/Withdraw History
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <Award className="w-3.5 h-3.5 text-[#f5d061]" /> Provably Fair Randomness
            </span>
          </div>
        </div>
      </div>

      {/* 2. ROYAL MEGA LOTTERY & ₹5 CRORE BUMPER JACKPOT (Tempting Alluring Opportunity) */}
      <RoyalMegaLottery />

      {/* 3. Featured Luxury Games Showcase - Expensive 3D Graphics */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f5d061] animate-ping" />
            <div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                ORIGINAL 3D CASINO GAMES
              </h2>
              <p className="text-xs text-gray-400 font-mono-numbers">
                Select any luxury game card to launch immediately with your Winnings Balance
              </p>
            </div>
          </div>

          <button
            onClick={() => handlePlayNow('games', 'All 12 Casino Games')}
            className="text-xs font-bold text-[#f5d061] hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30"
          >
            <span>View All 12 Games</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 12 Dense High-Definition Luxury Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {gamesFeatured.map(game => (
            <div
              key={game.id}
              onClick={() => handlePlayNow(game.tab, game.title)}
              className={`group rounded-3xl bg-gradient-to-b ${game.bg} border ${game.border} p-4 sm:p-5 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(212,175,55,0.35)] cursor-pointer flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-[#f5d061] border border-[#d4af37]/40">
                  {game.badge}
                </span>
                {!currentUser ? (
                  <span className="text-[9px] font-bold text-amber-400 bg-black/70 border border-amber-500/40 px-1.5 py-0.5 rounded-full">
                    🔒 Sign In to Play
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>

              {/* Handcrafted Expensive 3D Luxury Icon */}
              <div className="py-2 flex items-center justify-center">
                <LuxuryGameIcon gameId={game.id} size="md" />
              </div>

              <div className="space-y-2 text-center pt-1">
                <div>
                  <h3 className="font-cinzel text-sm sm:text-base font-black text-white group-hover:text-[#f5d061] transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-[10px] text-gray-400 truncate">
                    {game.category}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayNow(game.tab, game.title);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r ${game.btnGrad} shadow-md flex items-center justify-center gap-1.5 transition-all hover:brightness-110 active:scale-95 cursor-pointer`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY NOW</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Platform VIP Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feature 1: Unified Balance */}
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-[#f5d061]">
            <Coins className="w-5 h-5" />
            <h4 className="font-cinzel text-sm font-bold text-white">Unified Winnings Balance</h4>
          </div>
          <p className="text-xs text-gray-400">
            All your winnings and credits operate in one unified balance without ceilings. Bet directly from winnings and view exact-second transaction logs anytime.
          </p>
          <button
            onClick={onOpenCashier}
            className="text-xs font-bold text-[#f5d061] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Wallet &amp; Statement</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Feature 2: Official Razorpay Gateway */}
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-[#f5d061]">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h4 className="font-cinzel text-sm font-bold text-white">Live Razorpay Gateway</h4>
          </div>
          <p className="text-xs text-gray-400">
            Secure, instant wallet credits via Razorpay. Supports UPI (GPay, PhonePe, Paytm), Net Banking, and Debit/Credit cards.
          </p>
          <button
            onClick={() => onSelectTab('deposit')}
            className="text-xs font-bold text-[#f5d061] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Deposit Funds Now</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Feature 3: Gemini VIP Concierge */}
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-[#f5d061]">
            <Sparkles className="w-5 h-5" />
            <h4 className="font-cinzel text-sm font-bold text-white">Gemini VIP AI Suite</h4>
          </div>
          <p className="text-xs text-gray-400">
            Multi-turn VIP Concierge chatbot via Gemini 3.8-flash, plus high-resolution VIP card &amp; avatar generator via Gemini 3 Pro.
          </p>
          <button
            onClick={() => onSelectTab('ai_studio')}
            className="text-xs font-bold text-[#f5d061] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Enter AI VIP Lounge</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

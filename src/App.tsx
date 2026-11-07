import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/layout/Navbar';
import { HomeHub } from './components/home/HomeHub';
import { GamesHub } from './components/games/GamesHub';
import { PaymentDemoScreen } from './components/payment/PaymentDemoScreen';
import { UserProfile } from './components/profile/UserProfile';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AiStudioHub } from './components/ai/AiStudioHub';
import { CashierModal } from './components/cashier/CashierModal';
import { ExportHostingGuide } from './components/export/ExportHostingGuide';
import { LuxuryMoneyAtmosphere } from './components/common/LuxuryMoneyAtmosphere';
import { RoyalMegaLottery } from './components/lottery/RoyalMegaLottery';
import { DepositPortal } from './components/deposit/DepositPortal';
import { WithdrawPortal } from './components/withdraw/WithdrawPortal';
import { AuthLoginModal } from './components/auth/AuthLoginModal';
import { AuthGate } from './components/auth/AuthGate';
import {
  Shield,
  Coins,
  Sparkles,
  Award,
  AlertTriangle,
  Github,
  Globe,
  Download,
} from 'lucide-react';

function AppContent() {
  const {
    currentUser,
    firstGameBonusNotification,
    dismissFirstGameBonusNotification,
    hasClaimedFirstGameBonus,
    depositClearanceNotification,
    dismissDepositClearanceNotification,
    phoneBonusNotification,
    dismissPhoneBonusNotification,
  } = useGame();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [cashierOpen, setCashierOpen] = useState<boolean>(false);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalDetails, setAuthModalDetails] = useState<{
    title?: string;
    subtitle?: string;
    requiredForGame?: string;
    pendingTab?: string;
  }>({});

  const requireAuthToPlay = (targetTab: string = 'games', gameTitle?: string) => {
    if (!currentUser) {
      setAuthModalDetails({
        title: gameTitle ? `MANDATORY AUTHENTICATION: PLAY ${gameTitle.toUpperCase()}` : 'SIGN IN OR REGISTER TO PLAY',
        subtitle: gameTitle
          ? `You must sign in or register before you can access or play ${gameTitle}. Verified players receive a fixed 110 Credits Welcome Bonus!`
          : 'Users must sign in or register before they can access or play any casino games. Claim 110 Credits upon sign in!',
        requiredForGame: gameTitle,
        pendingTab: targetTab,
      });
      setAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSelectTab = (tab: string) => {
    // Restrict all game access until authentication is complete
    const isGameTab = tab === 'games' || tab.startsWith('games_') || tab === 'lottery';
    if (isGameTab && !currentUser) {
      const gameTitles: Record<string, string> = {
        games: 'All 12 Casino Games',
        games_mining_rush: 'Mining Rush 1000X',
        games_fortune_tiger: 'Fortune Tiger 500X',
        games_roulette: 'European Roulette VIP',
        games_matka_poker: 'Matka Poker 200X',
        games_diamond_mines: 'Diamond Mines',
        games_candy_bonanza: 'Candy Bonanza 1000X',
        games_mines: '24-Tile Grenade Mines',
        games_tower: 'Royal Tower Climber',
        games_trading: 'Crypto Crash Trading',
        games_fortune: 'Fortune Wheel',
        games_puzzle: 'Bank Vault Cipher',
        games_chicken: 'Golden Road Chicken',
        games_aviator: 'Original Aviator 1000X',
        lottery: '₹5 Crore Royal Mega Lottery',
      };
      requireAuthToPlay(tab, gameTitles[tab] || 'Game');
      return;
    }

    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-[#e6edf3] flex flex-col font-sans selection:bg-[#d4af37] selection:text-black relative">
      {/* Luxury Money, Wealth & Gold Particle Background Atmosphere */}
      <LuxuryMoneyAtmosphere />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab.startsWith('games') ? 'games' : activeTab}
        setActiveTab={handleSelectTab}
        openCashier={() => setCashierOpen(true)}
        openExportModal={() => setExportOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Mobile Sign-In 110 Credits Welcome Bonus Awarded Banner */}
        {phoneBonusNotification && (
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-amber-500 via-[#f5d061] to-amber-500 p-0.5 shadow-[0_0_40px_rgba(245,208,97,0.5)] animate-in zoom-in-95 duration-300">
            <div className="rounded-[22px] bg-gradient-to-r from-[#171204] via-[#221806] to-[#120d03] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-300/60 flex items-center justify-center text-amber-300 flex-shrink-0 text-2xl shadow">
                  📱
                </div>
                <div>
                  <h3 className="font-cinzel text-base sm:text-lg font-black text-[#f5d061] flex items-center gap-2">
                    <span>🎉 MOBILE SIGN-IN BONUS: 110 CREDITS CREDITED!</span>
                    <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      Verified
                    </span>
                  </h3>
                  <p className="text-xs text-gray-200 mt-0.5 font-mono-numbers">
                    {phoneBonusNotification}
                  </p>
                </div>
              </div>
              <button
                onClick={dismissPhoneBonusNotification}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                Claimed &bull; Play Now
              </button>
            </div>
          </div>
        )}

        {/* Deposit Clearance Alert Banner (10-Minute delay completion) */}
        {depositClearanceNotification && (
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 p-0.5 shadow-[0_0_40px_rgba(16,185,129,0.5)] animate-in zoom-in-95 duration-300">
            <div className="rounded-[22px] bg-gradient-to-r from-[#071710] via-[#0d2218] to-[#05110c] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-300 flex items-center justify-center text-emerald-300 flex-shrink-0 text-2xl">
                  💰
                </div>
                <div>
                  <h3 className="font-cinzel text-base sm:text-lg font-black text-emerald-300">
                    DEPOSIT PAYMENT VERIFIED &amp; CREDITED
                  </h3>
                  <p className="text-xs text-gray-200 mt-0.5 font-mono-numbers">
                    {depositClearanceNotification}
                  </p>
                </div>
              </div>
              <button
                onClick={dismissDepositClearanceNotification}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* First Visit Bonus Awarded Banner */}
        {firstGameBonusNotification && (
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-[0_0_40px_rgba(245,158,11,0.5)] animate-in zoom-in-95 duration-300">
            <div className="rounded-[22px] bg-gradient-to-r from-[#171005] via-[#221706] to-[#120c03] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-300 flex items-center justify-center text-amber-300 flex-shrink-0 text-2xl">
                  🎁
                </div>
                <div>
                  <h3 className="font-cinzel text-base sm:text-lg font-black text-yellow-300">
                    🎉 FIRST-VISIT REWARD: +₹100 GUARANTEED PROFIT CREDITED!
                  </h3>
                  <p className="text-xs text-gray-200 mt-0.5 font-mono-numbers">
                    {firstGameBonusNotification} Credited directly to your unified wallet balance.
                  </p>
                </div>
              </div>
              <button
                onClick={dismissFirstGameBonusNotification}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                Claimed
              </button>
            </div>
          </div>
        )}

        {/* First Visit Welcome Notice (if not yet played) */}
        {!hasClaimedFirstGameBonus && !firstGameBonusNotification && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#171105] via-[#291e0a] to-[#140e04] border border-amber-500/40 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <span className="text-2xl flex-shrink-0">🌟</span>
              <div>
                <p className="font-cinzel text-xs sm:text-sm font-black text-[#f5d061]">
                  NEW VISITOR WELCOME GUARANTEE: Play any game once and receive guaranteed +₹100 Net Profit!
                </p>
                <p className="text-[11px] text-gray-400 font-mono-numbers">
                  Your very first game round across the entire casino platform guarantees +₹100 net profit.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSelectTab('games_mining_rush')}
              className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider hover:bg-yellow-400 transition-colors cursor-pointer flex-shrink-0"
            >
              Play Mining Rush
            </button>
          </div>
        )}

        {activeTab === 'home' && (
          <HomeHub
            onSelectTab={handleSelectTab}
            onOpenCashier={() => {
              if (!currentUser) {
                requireAuthToPlay('home', 'Unified Wallet');
              } else {
                setCashierOpen(true);
              }
            }}
            onRequireAuth={(targetTab, gameTitle) => requireAuthToPlay(targetTab, gameTitle)}
          />
        )}

        {activeTab === 'games' && (
          <GamesHub
            initialGame={null}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay(`games_${gameId}`, gameTitle)}
          />
        )}
        {activeTab === 'lottery' && (
          <div className="space-y-6">
            <RoyalMegaLottery onRequireAuth={() => requireAuthToPlay('lottery', '₹5 Crore Royal Mega Lottery')} />
            <GamesHub
              initialGame={null}
              onRequireAuth={(gameId, gameTitle) => requireAuthToPlay(`games_${gameId}`, gameTitle)}
            />
          </div>
        )}
        {activeTab === 'games_mining_rush' && (
          <GamesHub
            initialGame="mining_rush"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_mining_rush', gameTitle)}
          />
        )}
        {activeTab === 'games_fortune_tiger' && (
          <GamesHub
            initialGame="fortune_tiger"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_fortune_tiger', gameTitle)}
          />
        )}
        {activeTab === 'games_roulette' && (
          <GamesHub
            initialGame="roulette"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_roulette', gameTitle)}
          />
        )}
        {activeTab === 'games_matka_poker' && (
          <GamesHub
            initialGame="matka_poker"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_matka_poker', gameTitle)}
          />
        )}
        {activeTab === 'games_diamond_mines' && (
          <GamesHub
            initialGame="diamond_mines"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_diamond_mines', gameTitle)}
          />
        )}
        {activeTab === 'games_candy_bonanza' && (
          <GamesHub
            initialGame="candy_bonanza"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_candy_bonanza', gameTitle)}
          />
        )}
        {activeTab === 'games_mines' && (
          <GamesHub
            initialGame="mines"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_mines', gameTitle)}
          />
        )}
        {activeTab === 'games_tower' && (
          <GamesHub
            initialGame="tower"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_tower', gameTitle)}
          />
        )}
        {activeTab === 'games_trading' && (
          <GamesHub
            initialGame="trading"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_trading', gameTitle)}
          />
        )}
        {activeTab === 'games_fortune' && (
          <GamesHub
            initialGame="fortune"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_fortune', gameTitle)}
          />
        )}
        {activeTab === 'games_puzzle' && (
          <GamesHub
            initialGame="puzzle"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_puzzle', gameTitle)}
          />
        )}
        {activeTab === 'games_chicken' && (
          <GamesHub
            initialGame="chicken"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_chicken', gameTitle)}
          />
        )}
        {activeTab === 'games_aviator' && (
          <GamesHub
            initialGame="aviator"
            onBackToLobby={() => setActiveTab('games')}
            onRequireAuth={(gameId, gameTitle) => requireAuthToPlay('games_aviator', gameTitle)}
          />
        )}

        {activeTab === 'payment_demo' && <PaymentDemoScreen />}
        {activeTab === 'deposit' && (
          <DepositPortal
            onBackToGames={() => handleSelectTab('games')}
            onGoHome={() => handleSelectTab('home')}
            onSwitchToWithdraw={() => handleSelectTab('withdraw')}
          />
        )}
        {activeTab === 'withdraw' && (
          <WithdrawPortal
            onBackToGames={() => handleSelectTab('games')}
            onGoHome={() => handleSelectTab('home')}
            onSwitchToDeposit={() => handleSelectTab('deposit')}
          />
        )}
        {activeTab === 'profile' && <UserProfile />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'ai_studio' && <AiStudioHub />}
        {activeTab === 'phone_auth' && (
          <AuthLoginModal
            isOpen={true}
            onClose={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* Mandatory Authentication Modal for Games Access & Registration */}
      <AuthLoginModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authModalDetails.title}
        subtitle={authModalDetails.subtitle}
        requiredForGame={authModalDetails.requiredForGame}
        onSuccess={() => {
          setAuthModalOpen(false);
          if (authModalDetails.pendingTab) {
            setActiveTab(authModalDetails.pendingTab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* Virtual Cashier Modal */}
      <CashierModal
        isOpen={cashierOpen}
        onClose={() => setCashierOpen(false)}
      />

      {/* Export & Free Hosting Guide Modal */}
      <ExportHostingGuide
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />

      {/* Premium Footer */}
      <footer className="mt-auto border-t border-[#242c3d] bg-[#05070a] text-gray-400 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5d061] via-[#d4af37] to-[#8c7322] flex items-center justify-center text-black font-cinzel font-black text-xl shadow-lg">
                B
              </div>
              <div>
                <span className="font-cinzel text-xl font-black text-white tracking-wider">
                  BITORA
                </span>
                <p className="text-[11px] text-gray-500 font-mono-numbers">
                  LUXURY CASINO GAMING SIMULATION SUITE
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <button
                onClick={() => handleSelectTab('home')}
                className="hover:text-white transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => handleSelectTab('games')}
                className="hover:text-white transition-colors"
              >
                Demo Games (Mines, Chicken, Aviator)
              </button>
              <button
                onClick={() => handleSelectTab('payment_demo')}
                className="hover:text-white transition-colors"
              >
                QR Demo
              </button>
              <button
                onClick={() => handleSelectTab('ai_studio')}
                className="hover:text-white transition-colors"
              >
                Gemini VIP Concierge
              </button>
              <button
                onClick={() => handleSelectTab('admin')}
                className="hover:text-white transition-colors"
              >
                Admin Suite
              </button>
              <button
                onClick={() => setExportOpen(true)}
                className="text-[#f5d061] hover:underline transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export &amp; Hosting Guide</span>
              </button>
            </div>
          </div>

          {/* Legal & Responsible Gaming Disclaimer */}
          <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4 text-center text-xs space-y-1.5 text-gray-400">
            <p className="font-bold text-amber-300 uppercase tracking-wide flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              DEMONSTRATION &amp; SIMULATION NOTICE (For Demonstration and Entertainment Purposes Only)
            </p>
            <p className="max-w-4xl mx-auto text-[11px] leading-relaxed text-gray-400">
              BITORA operates entirely using virtual demo credits with zero real-money value. Minimum top-up is ₹100, and balances are strictly capped at a maximum of ₹5,000. No real-money gambling deposits, payouts, or withdrawals are processed under any circumstances.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-2 border-t border-[#1a2130] pt-6">
            <p>&copy; {new Date().getFullYear()} BITORA Platform. All rights reserved.</p>
            <p className="font-mono-numbers">
              Platform Status: Online &bull; Engine: Vite + React 19 + Express &bull; Audio: Web Audio API
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

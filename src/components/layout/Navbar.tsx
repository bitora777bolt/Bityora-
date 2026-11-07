import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Coins,
  Shield,
  User as UserIcon,
  Gamepad2,
  QrCode,
  Sparkles,
  Volume2,
  VolumeX,
  Download,
  LogOut,
  ChevronDown,
  PlusCircle,
  ArrowUpRight,
  Menu,
  X,
  Trophy,
  Ticket,
  Smartphone,
  Lock,
  UserPlus,
} from 'lucide-react';
import { AccountStatementModal } from '../wallet/AccountStatementModal';
import { AuthLoginModal } from '../auth/AuthLoginModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCashier: () => void;
  openExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openCashier,
  openExportModal,
}) => {
  const { currentUser, users, loginAs, logout, soundEnabled, toggleSound, totalWinnings, winningsBalance } = useGame();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementTab, setStatementTab] = useState<'STATEMENT' | 'DEPOSIT' | 'WITHDRAW'>('STATEMENT');
  const [depositResetKey, setDepositResetKey] = useState<number>(0);
  const [phoneAuthOpen, setPhoneAuthOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-[#080a10]/95 backdrop-blur-md border-b border-[#242c3d]">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-[#171306] via-[#2c2206] to-[#171306] border-b border-[#d4af37]/20 px-4 py-1 text-center text-[11px] sm:text-xs text-[#f5d061] flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f5d061] animate-ping" />
        <span className="font-semibold tracking-wider uppercase">BITORA VIRTUAL GAMING PLATFORM</span>
        <span className="text-gray-400 hidden sm:inline">|</span>
        <span className="text-gray-300 hidden sm:inline">
          100% Demo Credits (Virtual Credits) &bull; Maximum Balance: ₹5,000 &bull; No Real-Money Gambling
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('games');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left group transition-transform hover:scale-[1.02]"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5d061] via-[#d4af37] to-[#8c7322] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.35)] border border-[#fff2a3]/40">
                <span className="font-cinzel font-black text-black text-xl tracking-tighter">B</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-cinzel text-xl sm:text-2xl font-black tracking-wider gold-text-gradient">
                    BITORA
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d061]">
                    VIP DEMO
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 tracking-widest uppercase font-mono-numbers">
                  PREMIUM GAMING SUITE
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('games')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'games'
                  ? 'bg-[#d4af37]/15 text-[#f5d061] border border-[#d4af37]/35 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-[#d4af37]" />
              Demo Games
            </button>

            <button
              onClick={() => setActiveTab('lottery')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'lottery'
                  ? 'bg-amber-500/20 text-[#f5d061] border border-[#d4af37]/45 shadow-[0_0_12px_rgba(245,208,97,0.3)]'
                  : 'text-amber-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Ticket className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>₹5 Cr Lottery</span>
            </button>

            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-black transition-all cursor-pointer ${
                activeTab === 'deposit'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                  : 'text-emerald-400 hover:text-white hover:bg-emerald-500/10 border border-emerald-500/30'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Deposit</span>
            </button>

            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-black transition-all cursor-pointer ${
                activeTab === 'withdraw'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_15px_rgba(245,208,97,0.35)]'
                  : 'text-amber-300 hover:text-white hover:bg-amber-500/10 border border-amber-500/30'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={() => setActiveTab('payment_demo')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'payment_demo'
                  ? 'bg-[#d4af37]/15 text-[#f5d061] border border-[#d4af37]/35 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#d4af37]" />
              QR Demo
            </button>

            <button
              onClick={() => setActiveTab('ai_studio')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'ai_studio'
                  ? 'bg-[#d4af37]/15 text-[#f5d061] border border-[#d4af37]/35 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#f5d061]" />
              AI VIP Concierge
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#d4af37]/15 text-[#f5d061] border border-[#d4af37]/35 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserIcon className="w-4 h-4 text-[#d4af37]" />
              Account &amp; History
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              Admin {isAdmin && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dedicated Mobile Phone Sign-In Button with reCAPTCHA & OTP */}
            <button
              type="button"
              onClick={() => setPhoneAuthOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#f5d061]/25 to-amber-500/20 hover:from-amber-500/35 hover:to-[#f5d061]/40 border border-[#f5d061]/60 text-[#f5d061] text-xs font-black shadow-[0_0_15px_rgba(245,208,97,0.25)] transition-all cursor-pointer active:scale-95 group shrink-0"
              title="Sign In with Mobile OTP & get 110 Credits Welcome Bonus!"
            >
              <Smartphone className="w-4 h-4 text-[#f5d061] group-hover:scale-110 transition-transform" />
              <span className="font-extrabold tracking-wide">Sign In</span>
              <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-300 text-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                +110 Credits
              </span>
            </button>

            {/* UNIFIED SINGLE WINNINGS BALANCE COLUMN (Used directly for all bets & payouts) */}
            {!currentUser ? (
              <button
                type="button"
                onClick={() => setPhoneAuthOpen(true)}
                className="bg-gradient-to-r from-[#121724] via-[#161d2d] to-[#0f1420] border border-[#d4af37]/40 hover:border-[#f5d061] rounded-2xl px-3 py-1.5 sm:py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.15)] cursor-pointer transition-all hover:scale-[1.02]"
                title="Sign in or register to view balance and claim 110 Credits"
              >
                <Lock className="w-3.5 h-3.5 text-[#f5d061]" />
                <div className="text-left">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Balance</span>
                  <span className="text-xs font-black text-[#f5d061]">Sign In to View</span>
                </div>
              </button>
            ) : (
              <div
                onClick={() => {
                  setStatementTab('STATEMENT');
                  setStatementModalOpen(true);
                }}
                className="bg-gradient-to-r from-[#121724] via-[#161d2d] to-[#0f1420] border border-[#d4af37]/40 hover:border-[#f5d061] rounded-2xl p-1 sm:p-1.5 flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.15)] cursor-pointer transition-all hover:scale-[1.02]"
                title="Click to view detailed Statement & Transactions History"
              >
                <div className="pl-2 sm:pl-2.5">
                  <div className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#f5d061]" />
                    <span className="text-[10px] text-gray-300 uppercase tracking-wider font-bold">
                      Balance
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono-numbers text-sm sm:text-base font-black text-[#f5d061]">
                      ₹{currentUser.balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Deposit Quick Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('deposit');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-[11px] px-2 sm:px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Deposit Funds (Select from ₹110, ₹200, ₹400, ₹800, ₹1000, ₹1600, ₹5000)"
                >
                  <span>+ Deposit</span>
                </button>

                {/* Withdraw Quick Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatementTab('WITHDRAW');
                    setStatementModalOpen(true);
                  }}
                  className="bg-[#182132] hover:bg-[#202c42] text-amber-300 border border-amber-500/40 font-black text-[11px] px-2 sm:px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Withdraw Funds"
                >
                  <span>Withdraw</span>
                </button>
              </div>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-[#121622] border border-[#242c3d] text-gray-400 hover:text-[#f5d061] hover:border-[#d4af37]/40 transition-colors"
              title={soundEnabled ? 'Mute Game Audio' : 'Enable Game Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#f5d061]" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Export & Hosting Guide Button */}
            <button
              onClick={openExportModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#121622] border border-[#242c3d] text-gray-300 hover:text-white hover:border-[#d4af37]/40 text-xs font-medium transition-all"
              title="Export Source & Hosting Guide"
            >
              <Download className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Export</span>
            </button>

            {/* User Account Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-[#121622] border border-[#242c3d] hover:border-[#d4af37]/40 transition-all text-left"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser?.username}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-[#d4af37]/40"
                />
                <div className="hidden md:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate max-w-[90px]">
                      {currentUser?.username || 'Guest'}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold px-1 rounded bg-amber-400/10">
                      {isAdmin ? 'ADMIN' : currentUser?.vipTier}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono-numbers">
                    {currentUser?.id}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0e121a] border border-[#242c3d] rounded-2xl shadow-2xl p-2 z-50">
                  <div className="p-2 border-b border-[#242c3d] mb-1">
                    <p className="text-xs font-bold text-white">{currentUser?.username}</p>
                    <p className="text-[11px] text-gray-400 font-mono-numbers">{currentUser?.id}</p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                      <span className="text-[10px] text-gray-400">Demo Balance:</span>
                      <span className="text-xs font-bold text-[#f5d061] font-mono-numbers">
                        ₹{currentUser?.balance.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Firebase Phone Auth Login Action */}
                  <div className="p-1.5 border-b border-[#242c3d]">
                    <button
                      onClick={() => {
                        setPhoneAuthOpen(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs bg-gradient-to-r from-amber-500/15 via-[#f5d061]/20 to-amber-500/15 hover:from-amber-500/25 hover:to-[#f5d061]/30 text-[#f5d061] border border-amber-500/40 transition-all font-bold cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4 text-[#f5d061] shrink-0" />
                      <div>
                        <p className="leading-tight">Firebase Phone Login</p>
                        <p className="text-[9px] text-gray-400 font-normal">SMS OTP &bull; v9 Modular SDK</p>
                      </div>
                    </button>
                  </div>

                  {/* Fast Switcher between Demo Accounts */}
                  <div className="p-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1">
                      Quick Switch Account (Demo)
                    </p>
                    <div className="space-y-1">
                      {users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            loginAs(u.id);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                            currentUser?.id === u.id
                              ? 'bg-[#d4af37]/15 text-[#f5d061] border border-[#d4af37]/30'
                              : 'hover:bg-white/5 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <div>
                              <p className="font-semibold leading-tight">{u.username}</p>
                              <p className="text-[10px] text-gray-500 font-mono-numbers">{u.id} &bull; {u.role.toUpperCase()}</p>
                            </div>
                          </div>
                          <span className="font-mono-numbers font-bold text-[11px] text-[#f5d061]">
                            ₹{u.balance}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#242c3d] pt-1 mt-1">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#121622] border border-[#242c3d] text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#242c3d] py-3 space-y-1 bg-[#080a10]">
            {/* Mobile Sign In button */}
            <button
              onClick={() => {
                setPhoneAuthOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#f5d061]/25 to-amber-500/20 border border-[#f5d061]/60 text-[#f5d061] font-bold text-xs shadow-md mb-2"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#f5d061]" />
                <span>Mobile Sign In (reCAPTCHA + OTP)</span>
              </div>
              <span className="bg-[#f5d061] text-black font-black text-[10px] px-2 py-0.5 rounded-full">
                +110 Bonus
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('games');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                activeTab === 'games' ? 'bg-[#d4af37]/20 text-[#f5d061]' : 'text-gray-300'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-[#d4af37]" />
              Demo Games Hub
            </button>
            <button
              onClick={() => {
                setActiveTab('lottery');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                activeTab === 'lottery' ? 'bg-amber-500/25 text-[#f5d061]' : 'text-amber-300'
              }`}
            >
              <Ticket className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>₹5 Crore Royal Lottery</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('deposit');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-black ${
                activeTab === 'deposit'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md'
                  : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Deposit Funds (₹110 - ₹5,000)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('payment_demo');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                activeTab === 'payment_demo' ? 'bg-[#d4af37]/20 text-[#f5d061]' : 'text-gray-300'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#d4af37]" />
              QR Deposit Demo
            </button>
            <button
              onClick={() => {
                setActiveTab('ai_studio');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                activeTab === 'ai_studio' ? 'bg-[#d4af37]/20 text-[#f5d061]' : 'text-gray-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#f5d061]" />
              AI VIP Concierge &amp; Art Studio
            </button>
            <button
              onClick={() => {
                setActiveTab('profile');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                activeTab === 'profile' ? 'bg-[#d4af37]/20 text-[#f5d061]' : 'text-gray-300'
              }`}
            >
              <UserIcon className="w-4 h-4 text-[#d4af37]" />
              Account &amp; History
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                activeTab === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'text-gray-300'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              Admin Dashboard
            </button>
            <div className="pt-2 border-t border-[#242c3d] flex flex-col gap-2">
              <button
                onClick={() => {
                  setActiveTab('deposit');
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs rounded-xl text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Deposit (Select ₹110 - ₹5,000)</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    openCashier();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black font-bold text-xs rounded-lg text-center cursor-pointer"
                >
                  Instant Refill
                </button>
                <button
                  onClick={() => {
                    openExportModal();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 bg-[#121622] border border-[#242c3d] text-gray-300 text-xs rounded-lg text-center cursor-pointer"
                >
                  Export ZIP
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AccountStatementModal
        isOpen={statementModalOpen}
        onClose={() => setStatementModalOpen(false)}
        initialTab={statementTab}
        depositResetKey={depositResetKey}
        onGoHome={() => {
          setActiveTab('home');
          setStatementModalOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Firebase Phone Authentication Modal - Centered Vertically & Horizontally via Fixed & Flexbox */}
      <AuthLoginModal
        isOpen={phoneAuthOpen}
        onClose={() => setPhoneAuthOpen(false)}
      />
    </header>
  );
};

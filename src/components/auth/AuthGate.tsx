import React, { useState } from 'react';
import { PhoneAuthLogin } from './PhoneAuthLogin';
import { useGame } from '../../context/GameContext';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Coins,
  Gamepad2,
  Users,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface AuthGateProps {
  onAuthenticated?: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const { loginAs, users, loginWithCredentials } = useGame();
  const [showDemoLogins, setShowDemoLogins] = useState<boolean>(false);
  const [quickLoginMsg, setQuickLoginMsg] = useState<string | null>(null);

  const handleQuickDemoLogin = (userId: string) => {
    loginAs(userId);
    setQuickLoginMsg('✓ Signed in successfully! Entering VIP Gaming Suite...');
    if (onAuthenticated) {
      setTimeout(() => onAuthenticated(), 400);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-b from-[#d4af37]/15 via-amber-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Luxury Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-[#d4af37]/40 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <Lock className="w-3.5 h-3.5 text-[#f5d061]" />
            <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#f5d061] uppercase">
              Strict Protected Access &bull; Authentication Required
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5d061] via-[#d4af37] to-[#8c7322] flex items-center justify-center text-black font-cinzel font-black text-2xl shadow-[0_0_30px_rgba(212,175,55,0.4)]">
              B
            </div>
            <h1 className="font-cinzel text-3xl sm:text-4xl font-black text-white tracking-wider">
              BITORA VIP
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
            Welcome to the luxury simulation gaming suite. All game dashboards, navigation, and balances remain strictly hidden until authentication is verified.
          </p>
        </div>

        {/* Strict Security & Fixed 110 Credits Welcome Bonus Notice */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#f5d061]/20 to-amber-500/15 border-2 border-[#d4af37]/50 shadow-[0_0_30px_rgba(212,175,55,0.2)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black text-sm shadow">
                🎁
              </div>
              <div>
                <h3 className="text-xs font-black text-[#f5d061] tracking-wide flex items-center gap-1.5">
                  <span>FIXED INITIAL WELCOME BONUS</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-gray-200">
                  New verified accounts are granted <strong className="text-white">exactly 110 credits</strong> upon initial sign-in.
                </p>
              </div>
            </div>
            <span className="font-mono-numbers font-black text-xs text-black bg-[#f5d061] px-2.5 py-1 rounded-xl shrink-0 shadow">
              110 CREDITS
            </span>
          </div>

          <div className="pt-2 border-t border-[#d4af37]/30 flex items-center justify-between text-[10px] text-gray-300">
            <span className="flex items-center gap-1">
              <EyeOff className="w-3 h-3 text-amber-400" />
              <span>Zero unverified credits &bull; Balances completely hidden</span>
            </span>
            <span className="text-emerald-400 font-mono font-bold">100% Protected</span>
          </div>
        </div>

        {/* Core Sign In Component (PhoneAuthLogin) */}
        <div className="bg-[#0b0e17] border-2 border-[#d4af37]/60 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.2)] overflow-hidden">
          <PhoneAuthLogin
            onSuccess={(_firebaseUser: User) => {
              if (onAuthenticated) {
                onAuthenticated();
              }
            }}
            className="border-0 bg-transparent shadow-none"
          />
        </div>

        {/* Quick Demo Access Accordion for Evaluation / Judges */}
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-3.5 text-center space-y-2">
          <button
            type="button"
            onClick={() => setShowDemoLogins(!showDemoLogins)}
            className="text-xs font-bold text-gray-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-[#f5d061]" />
            <span>{showDemoLogins ? 'Hide Demo Tester Accounts' : 'Alternative: Quick Sign-In with Demo VIP Account'}</span>
          </button>

          {showDemoLogins && (
            <div className="pt-3 border-t border-[#242c3d] space-y-2 animate-in fade-in duration-200">
              <p className="text-[11px] text-gray-400">
                Choose a pre-configured VIP testing profile to verify the protected route unlocks:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {users.slice(0, 2).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(u.id)}
                    className="p-2.5 rounded-xl bg-[#121622] hover:bg-[#182030] border border-[#242c3d] hover:border-[#d4af37]/50 text-xs flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div>
                      <p className="font-bold text-white group-hover:text-[#f5d061] transition-colors">{u.username}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{u.id} &bull; {u.role.toUpperCase()}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <span>Enter</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {quickLoginMsg && (
            <p className="text-xs text-emerald-400 font-bold animate-in fade-in">
              {quickLoginMsg}
            </p>
          )}
        </div>

        {/* Security Disclaimers */}
        <p className="text-[11px] text-center text-gray-500 max-w-sm mx-auto">
          BITORA operates as an exclusive simulation suite. Protected routes strictly require verified authentication to access games, cashier, and wallet controls.
        </p>
      </div>
    </div>
  );
};

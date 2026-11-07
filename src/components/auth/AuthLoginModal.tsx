import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PhoneAuthLogin } from './PhoneAuthLogin';
import { useGame } from '../../context/GameContext';
import {
  Lock,
  UserPlus,
  Smartphone,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Gamepad2,
  Users,
} from 'lucide-react';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user?: any) => void;
  title?: string;
  subtitle?: string;
  requiredForGame?: string;
  className?: string;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle,
  requiredForGame,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);
  const [authTab, setAuthTab] = useState<'PHONE_OTP' | 'REGISTER' | 'DEMO_LOGIN'>('PHONE_OTP');

  // Registration state
  const { registerUser, loginAs, users } = useGame();
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling while modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Clean up any stray recaptcha verifier when modal closes
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && (window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.warn('RecaptchaVerifier cleanup notice:', e);
        }
        (window as any).recaptchaVerifier = undefined;
      }
      const container = typeof document !== 'undefined' ? document.getElementById('recaptcha-container') : null;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regUsername.trim() || regUsername.trim().length < 3) {
      setRegError('Please enter a valid display name (at least 3 characters).');
      return;
    }

    if (!regPhone.trim() || regPhone.replace(/\D/g, '').length < 8) {
      setRegError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    setRegLoading(true);
    try {
      const email = regEmail.trim() || `${regUsername.toLowerCase().replace(/\s+/g, '')}@bitora.vip`;
      const newUser = registerUser(regUsername.trim(), email, regPhone.trim());
      setRegSuccess(`Registration successful! Fixed 110 Credits Welcome Bonus credited.`);
      setTimeout(() => {
        if (onSuccess) onSuccess(newUser);
        onClose();
      }, 700);
    } catch (err: any) {
      setRegError(err?.message || 'Failed to register account. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleQuickDemoLogin = (userId: string) => {
    loginAs(userId);
    setRegSuccess('Signed in with demo VIP profile. Access granted!');
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/90 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      {/* Background ambient lighting for luxury VIP focal emphasis */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center -z-10">
        <div className="w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      <div
        className={`relative w-full min-w-[320px] sm:min-w-[480px] md:min-w-[560px] max-w-xl md:max-w-2xl min-h-[480px] sm:min-h-[540px] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto my-auto rounded-3xl border-2 border-[#d4af37]/60 bg-[#0b0e17] shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.25)] flex flex-col justify-start animate-in zoom-in-95 duration-200 p-5 sm:p-8 ${className}`}
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#242c3d]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-[#d4af37]/40 text-[#f5d061] text-[10px] font-black uppercase tracking-wider">
              <Lock className="w-3 h-3 text-[#f5d061]" />
              <span>Mandatory Authentication Required</span>
            </div>
            <h2 id="auth-modal-title" className="font-cinzel text-lg sm:text-2xl font-black text-white tracking-wide">
              {title || (requiredForGame ? `UNLOCK & PLAY ${requiredForGame.toUpperCase()}` : 'SIGN IN OR REGISTER')}
            </h2>
            <p className="text-xs text-gray-300">
              {subtitle || (requiredForGame
                ? `You must sign in or register before you can access or play ${requiredForGame}.`
                : 'Users must sign in or register before accessing or playing any casino games.')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fixed 110 Credits Welcome Bonus Badge */}
        <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#f5d061]/20 to-amber-500/15 border border-[#d4af37]/50 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black text-base shadow">
              🎁
            </div>
            <div>
              <p className="text-xs font-black text-[#f5d061] tracking-wide flex items-center gap-1.5">
                <span>FIXED 110 CREDITS WELCOME BONUS</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </p>
              <p className="text-[10px] text-gray-300">
                Sign in or register now to unlock all 12 games + get 110 credits instantly.
              </p>
            </div>
          </div>
          <span className="font-mono-numbers font-black text-xs text-black bg-[#f5d061] px-2.5 py-1 rounded-xl shrink-0 shadow">
            +110 CREDITS
          </span>
        </div>

        {/* Tab Selection: Phone OTP vs Register vs Demo */}
        <div className="mt-4 grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#121622] border border-[#242c3d]">
          <button
            type="button"
            onClick={() => setAuthTab('PHONE_OTP')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authTab === 'PHONE_OTP'
                ? 'bg-gradient-to-r from-amber-500 to-[#d4af37] text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="truncate">Phone OTP</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthTab('REGISTER')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authTab === 'REGISTER'
                ? 'bg-gradient-to-r from-amber-500 to-[#d4af37] text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="truncate">Register</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthTab('DEMO_LOGIN')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authTab === 'DEMO_LOGIN'
                ? 'bg-gradient-to-r from-amber-500 to-[#d4af37] text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="truncate">Quick Demo</span>
          </button>
        </div>

        {/* TAB 1: PHONE SIGN IN (Modular Firebase v9) */}
        {authTab === 'PHONE_OTP' && (
          <div className="mt-3 flex-1">
            <PhoneAuthLogin
              onSuccess={(u) => {
                if (onSuccess) onSuccess(u);
                onClose();
              }}
              className="border-0 bg-transparent shadow-none p-0 min-h-0"
            />
          </div>
        )}

        {/* TAB 2: INSTANT REGISTRATION FORM */}
        {authTab === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3.5">
              {regError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Full Name / Username <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RoyalGamer77"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full h-11 bg-[#121622] border border-[#242c3d] focus:border-[#d4af37] rounded-xl px-3.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Mobile Phone Number <span className="text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full h-11 bg-[#121622] border border-[#242c3d] focus:border-[#d4af37] rounded-xl px-3.5 text-sm font-mono-numbers text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Email Address <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="player@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full h-11 bg-[#121622] border border-[#242c3d] focus:border-[#d4af37] rounded-xl px-3.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0e1320] border border-[#1e2535] text-xs text-gray-400 space-y-1">
                <p className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Instant Verification &amp; Crediting</span>
                </p>
                <p className="text-[11px] text-gray-400">
                  By registering, you immediately receive 110 Welcome Bonus credits and unlocked access to all 12 games.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={regLoading || !regUsername.trim() || !regPhone.trim()}
              className="w-full py-3.5 rounded-xl font-black text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.35)] transition-all uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <UserPlus className="w-4 h-4" />
              <span>{regLoading ? 'Creating VIP Profile...' : 'REGISTER & CLAIM 110 CREDITS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 3: DEMO TESTER ACCOUNTS */}
        {authTab === 'DEMO_LOGIN' && (
          <div className="mt-4 space-y-3 flex-1">
            <p className="text-xs text-gray-300">
              Select a pre-configured VIP testing profile to verify game access immediately:
            </p>

            <div className="space-y-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(u.id)}
                  className="w-full p-3 rounded-2xl bg-[#121622] hover:bg-[#182030] border border-[#242c3d] hover:border-[#d4af37]/60 text-xs flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="text-left">
                    <p className="font-bold text-white group-hover:text-[#f5d061] transition-colors">{u.username}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{u.id} &bull; {u.role.toUpperCase()}</p>
                  </div>
                  <span className="text-[11px] font-black text-black bg-[#f5d061] px-3 py-1 rounded-xl flex items-center gap-1 shadow group-hover:brightness-110">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Play Now</span>
                  </span>
                </button>
              ))}
            </div>

            {regSuccess && (
              <p className="text-xs text-emerald-400 font-bold text-center mt-2 animate-in fade-in">
                {regSuccess}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (mounted && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default AuthLoginModal;

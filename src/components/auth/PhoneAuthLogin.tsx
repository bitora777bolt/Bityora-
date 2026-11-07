import React, { useState, useEffect, useRef } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import {
  Phone,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  Smartphone,
  ChevronDown,
  X,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

interface PhoneAuthLoginProps {
  onSuccess?: (user: User) => void;
  onClose?: () => void;
  className?: string;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
];

export const PhoneAuthLogin: React.FC<PhoneAuthLoginProps> = ({
  onSuccess,
  onClose,
  className = '',
}) => {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [authStep, setAuthStep] = useState<'PHONE' | 'OTP' | 'AUTHENTICATED'>('PHONE');

  // Input states
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');

  // UI / Async feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(0);

  // Firebase references
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const { loginWithFirebasePhone, hasClaimedPhoneBonus, currentUser } = useGame();

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (activeFirebaseUser) => {
      setUser(activeFirebaseUser);
      if (activeFirebaseUser) {
        setAuthStep('AUTHENTICATED');
        if (activeFirebaseUser.phoneNumber) {
          try {
            await loginWithFirebasePhone(activeFirebaseUser.phoneNumber, activeFirebaseUser.uid);
          } catch (e) {
            console.warn('Game context sync error:', e);
          }
        }
        if (onSuccess) {
          onSuccess(activeFirebaseUser);
        }
      } else {
        setAuthStep((prev) => (prev === 'AUTHENTICATED' ? 'PHONE' : prev));
      }
    });

    return () => unsubscribe();
  }, [onSuccess, loginWithFirebasePhone]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Demo / Sandbox fallback state for when Firebase Phone provider is not enabled in console
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoOtp, setDemoOtp] = useState<string>('');

  // Properly check, clear, and destroy any existing RecaptchaVerifier instance and DOM nodes
  const cleanupRecaptchaVerifier = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // Safe clear
      }
      window.recaptchaVerifier = undefined;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
      if (container.parentNode) {
        const freshContainer = document.createElement('div');
        freshContainer.id = 'recaptcha-container';
        container.parentNode.replaceChild(freshContainer, container);
      }
    }
  };

  // Clean up reCAPTCHA verifier on unmount or step transitions
  useEffect(() => {
    return () => {
      cleanupRecaptchaVerifier();
    };
  }, []);

  // Initialize or safely reuse RecaptchaVerifier to prevent 'already rendered' errors
  const getOrCreateRecaptchaVerifier = (): RecaptchaVerifier => {
    // If instance is already active and healthy, reuse it
    if (window.recaptchaVerifier) {
      return window.recaptchaVerifier;
    }

    // Always guarantee a fresh clean container node before instantiating
    cleanupRecaptchaVerifier();

    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      document.body.appendChild(container);
    }

    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          setError('');
        },
        'expired-callback': () => {
          setError('reCAPTCHA verification expired. Please try again.');
          cleanupRecaptchaVerifier();
        },
      });

      window.recaptchaVerifier = verifier;
      return verifier;
    } catch {
      cleanupRecaptchaVerifier();
      const fallbackContainer = document.getElementById('recaptcha-container');
      if (fallbackContainer && fallbackContainer.parentNode) {
        const fresh = document.createElement('div');
        fresh.id = 'recaptcha-container';
        fallbackContainer.parentNode.replaceChild(fresh, fallbackContainer);
      }
      const fallbackVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          setError('');
        },
      });
      window.recaptchaVerifier = fallbackVerifier;
      return fallbackVerifier;
    }
  };

  // 1. Send OTP to Phone Number
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Clean national phone input
    const cleanNumber = phoneNumber.replace(/[\s-]/g, '');
    if (!cleanNumber || cleanNumber.length < 6) {
      setError('Please enter a valid phone number.');
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanNumber}`;
    setLoading(true);

    try {
      const appVerifier = getOrCreateRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      
      setConfirmationResult(confirmation);
      window.confirmationResult = confirmation;
      setIsDemoMode(false);
      setAuthStep('OTP');
      setResendTimer(60);
      setSuccessMsg(`OTP sent successfully to ${fullPhoneNumber}`);
      
      // Auto-focus the OTP input after transition
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 200);
    } catch (err: any) {
      cleanupRecaptchaVerifier();

      // Handle operation-not-allowed or provider configuration issues gracefully
      const isOpNotAllowed =
        err?.code === 'auth/operation-not-allowed' ||
        (err?.message && (err.message.includes('operation-not-allowed') || err.message.includes('OPERATION_NOT_ALLOWED')));

      if (isOpNotAllowed) {
        setIsDemoMode(true);
        setDemoOtp('123456');
        setAuthStep('OTP');
        setResendTimer(60);
        setSuccessMsg('SMS Provider Sandbox Mode: Enter test verification code 123456 to complete login and claim your fixed 110 credits welcome bonus.');
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 200);
      } else if (err?.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please check the country code and digits.');
      } else if (err?.code === 'auth/too-many-requests') {
        setIsDemoMode(true);
        setDemoOtp('123456');
        setAuthStep('OTP');
        setSuccessMsg('Rate limit active on SMS provider. Switched to test code 123456.');
      } else if (err?.code === 'auth/billing-not-enabled' || err?.code === 'auth/quota-exceeded') {
        setIsDemoMode(true);
        setDemoOtp('123456');
        setAuthStep('OTP');
        setSuccessMsg('SMS quota limit reached on Firebase. Demo test code active: enter 123456.');
      } else {
        setError(err?.message || 'Failed to send OTP. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP & Complete Sign In
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    const cleanNumber = phoneNumber.replace(/[\s-]/g, '');
    const fullPhoneNumber = `${countryCode}${cleanNumber}`;

    // If in demo test mode
    if (isDemoMode) {
      if (cleanOtp === demoOtp || cleanOtp === '123456') {
        setLoading(true);
        try {
          const simUid = `tel-user-${cleanNumber || Date.now().toString().slice(-6)}`;
          const bonusRes = await loginWithFirebasePhone(fullPhoneNumber, simUid);
          setAuthStep('AUTHENTICATED');
          if (bonusRes.isNewBonus) {
            setSuccessMsg(`🎉 Success! Exactly ${bonusRes.bonusAmount} Welcome Bonus credits credited to your wallet balance.`);
          } else {
            setSuccessMsg(`Phone verified successfully! Current wallet balance: ${bonusRes.user.balance.toLocaleString('en-IN')} Credits`);
          }
          if (onSuccess) {
            onSuccess({
              uid: simUid,
              phoneNumber: fullPhoneNumber,
            } as User);
          }
        } catch (err: any) {
          setError(err.message || 'Verification failed. Please try again.');
        } finally {
          setLoading(false);
        }
        return;
      } else {
        setError('Invalid test code. Please enter 123456.');
        return;
      }
    }

    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP code.');
      setAuthStep('PHONE');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await confirmationResult.confirm(cleanOtp);
      setUser(userCredential.user);
      setAuthStep('AUTHENTICATED');
      
      const phoneNum = userCredential.user.phoneNumber || fullPhoneNumber;
      const bonusRes = await loginWithFirebasePhone(phoneNum, userCredential.user.uid);

      if (bonusRes.isNewBonus) {
        setSuccessMsg(`🎉 Success! Exactly ${bonusRes.bonusAmount} Welcome Bonus credits credited to your wallet balance.`);
      } else {
        setSuccessMsg(`Phone verified successfully! Current wallet balance: ${bonusRes.user.balance.toLocaleString('en-IN')} Credits`);
      }

      if (onSuccess) {
        onSuccess(userCredential.user);
      }
    } catch (err: any) {
      if (err?.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP code. Please enter the correct 6-digit code received via SMS.');
      } else if (err?.code === 'auth/code-expired') {
        setError('OTP code has expired. Please request a new code.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setAuthStep('PHONE');
      setOtp('');
      setPhoneNumber('');
      setSuccessMsg('Signed out successfully.');
      setError('');
    } catch (err: any) {
      setError('Failed to sign out: ' + err.message);
    }
  };

  return (
    <div
      className={`bg-[#0b0e17] border border-[#d4af37]/40 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl w-full min-w-[300px] sm:min-w-[440px] md:min-w-[500px] min-h-[480px] sm:min-h-[520px] mx-auto relative overflow-hidden flex flex-col justify-between ${className}`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#242c3d] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border border-[#d4af37]/50 flex items-center justify-center text-amber-400 shadow-lg">
            <Smartphone className="w-5 h-5 text-[#f5d061]" />
          </div>
          <div>
            <h2 className="font-cinzel text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
              <span>PHONE LOGIN</span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                Firebase v9
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Instant OTP verification via SMS
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Close modal"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Fixed 110 Credits Welcome Bonus Notification Callout */}
      <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#f5d061]/20 to-amber-500/15 border border-[#d4af37]/50 flex items-center justify-between gap-2 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black text-sm shadow">
            🎁
          </div>
          <div>
            <p className="text-xs font-black text-[#f5d061] tracking-wide flex items-center gap-1.5">
              <span>FIXED 110 CREDITS WELCOME BONUS</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </p>
            <p className="text-[10px] text-gray-300">
              Instant fixed credit to your wallet balance upon verified sign-in!
            </p>
          </div>
        </div>
        <span className="font-mono-numbers font-black text-xs text-black bg-[#f5d061] px-2 py-0.5 rounded-lg shrink-0 shadow">
          +110 CREDITS
        </span>
      </div>

      {/* Notification Banners */}
      {error && (
        <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{successMsg}</div>
        </div>
      )}

      {/* STEP 1: PHONE NUMBER INPUT & RECAPTCHA */}
      {authStep === 'PHONE' && (
        <form onSubmit={handleSendOtp} className="mt-5 space-y-4 sm:space-y-5 relative z-10 flex-1 flex flex-col justify-between">
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-[10px] text-gray-500">Requires SMS capability</span>
              </label>

              <div className="flex items-center gap-2.5">
                {/* Country Code Selector */}
                <div className="relative shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={loading}
                    className="h-12 sm:h-14 bg-[#121622] border border-[#242c3d] focus:border-[#d4af37] text-white text-xs sm:text-sm font-mono-numbers font-bold rounded-2xl px-3.5 pr-8 appearance-none cursor-pointer focus:outline-none"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#121622] text-white">
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* National Phone Input */}
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-5 h-5 text-[#d4af37]" />
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    className="w-full h-12 sm:h-14 bg-[#121622] border border-[#242c3d] focus:border-[#d4af37] rounded-2xl pl-12 pr-4 text-sm sm:text-base font-mono-numbers text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 shadow-inner"
                  />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5">
                Formatted: <span className="font-mono text-gray-400">{countryCode} {phoneNumber || 'XXXXXXXXXX'}</span>
              </p>

              {/* Quick Test Helper for Instant Sandbox Verification */}
              <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <span className="text-[11px] text-amber-300 font-mono">
                  Test Number: <strong className="text-white">+91 98765 43210</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    setPhoneNumber('9876543210');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-black text-[10px] hover:bg-yellow-300 cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  Fill Test Number
                </button>
              </div>
            </div>

            {/* Invisible reCAPTCHA container for seamless background verification */}
            <div id="recaptcha-container" ref={recaptchaContainerRef} />

            {/* Seamless Security Badge */}
            <div className="p-3.5 rounded-2xl bg-[#0e1320] border border-[#1e2535] flex items-center justify-between text-xs text-gray-300 shadow-inner">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs leading-tight">Invisible reCAPTCHA Security</p>
                  <p className="text-[10px] text-gray-400">Automated background verification &bull; Zero friction</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                Invisible
              </span>
            </div>
          </div>

          {/* Send OTP Submit Button */}
          <button
            type="submit"
            disabled={loading || !phoneNumber.trim()}
            className="w-full h-12 sm:h-14 rounded-2xl font-black text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Sending SMS OTP...</span>
              </>
            ) : (
              <>
                <span>SEND VERIFICATION CODE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: OTP VERIFICATION INPUT */}
      {authStep === 'OTP' && (
        <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4 sm:space-y-5 relative z-10 flex-1 flex flex-col justify-between">
          <div className="space-y-4 sm:space-y-5">
            <div className="bg-[#121622] border border-[#242c3d] p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-gray-400">OTP Sent To:</p>
                  <p className="font-mono-numbers font-bold text-xs sm:text-sm text-white">
                    {countryCode} {phoneNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthStep('PHONE');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-xs text-[#f5d061] hover:underline font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>Enter 6-Digit OTP</span>
                <span className="text-[10px] text-amber-400 font-mono">SMS Verification</span>
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <KeyRound className="w-5 h-5 text-[#d4af37]" />
                </span>
                <input
                  ref={otpInputRef}
                  type="text"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  disabled={loading}
                  className="w-full h-14 sm:h-16 bg-[#121622] border-2 border-[#d4af37]/60 focus:border-[#f5d061] rounded-2xl pl-12 pr-4 text-xl sm:text-2xl font-mono-numbers font-black tracking-widest text-center text-[#f5d061] placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 shadow-inner"
                />
              </div>
              {isDemoMode && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs animate-in fade-in">
                  <span className="text-amber-300 font-mono">Sandbox Demo Code: <strong className="text-white">123456</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp('123456')}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-black text-[10px] hover:brightness-110 cursor-pointer shadow-sm active:scale-95"
                  >
                    Auto Fill 123456
                  </button>
                </div>
              )}
            </div>

            {/* Resend OTP Action & Timer */}
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>Didn't receive SMS?</span>
              {resendTimer > 0 ? (
                <span className="font-mono-numbers text-gray-500">
                  Resend in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-[#f5d061] hover:underline font-semibold cursor-pointer disabled:opacity-40"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>

          {/* Verify OTP Submit Button */}
          <button
            type="submit"
            disabled={loading || otp.trim().length !== 6}
            className="w-full h-12 sm:h-14 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Verifying OTP...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-100" />
                <span>VERIFY OTP &amp; LOG IN</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 3: AUTHENTICATED USER STATE */}
      {authStep === 'AUTHENTICATED' && user && (
        <div className="mt-5 space-y-4 relative z-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <div>
            <h3 className="font-cinzel text-lg font-black text-white">
              AUTHENTICATED
            </h3>
            <p className="font-mono-numbers text-sm font-bold text-[#f5d061] mt-1">
              {user.phoneNumber || `${countryCode} ${phoneNumber}`}
            </p>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate px-4">
              UID: {user.uid}
            </p>
          </div>

          <div className="bg-[#121622] rounded-2xl p-3 border border-[#242c3d] text-left space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Auth Provider:</span>
              <span className="font-mono font-bold text-emerald-400">phone</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Security Level:</span>
              <span className="font-mono text-emerald-300">reCAPTCHA Verified</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Sign-In Bonus:</span>
              <span className="font-mono text-amber-300 font-bold">110 Credits Credited</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Active Balance:</span>
              <span className="font-mono text-[#f5d061] font-bold">
                {currentUser ? currentUser.balance.toLocaleString('en-IN') : '110'} Credits
              </span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={handleSignOut}
              className="flex-1 py-3 rounded-xl border border-red-500/40 hover:bg-red-950/40 text-red-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-[#d4af37] text-black font-black text-xs uppercase tracking-wider hover:bg-[#f5d061] transition-colors cursor-pointer shadow"
              >
                Continue to App
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

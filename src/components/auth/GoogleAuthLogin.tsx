import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import {
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';

interface GoogleAuthLoginProps {
  onSuccess?: (user: FirebaseUser) => void;
  onClose?: () => void;
  className?: string;
}

export const GoogleAuthLogin: React.FC<GoogleAuthLoginProps> = ({
  onSuccess,
  onClose,
  className = '',
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const { loginWithFirebaseGoogle, currentUser, welcomeBonusNotification, dismissWelcomeBonusNotification } = useGame();

  // Monitor Firebase Auth session state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (activeUser) => {
      setFirebaseUser(activeUser);
      if (activeUser) {
        try {
          await loginWithFirebaseGoogle({
            uid: activeUser.uid,
            email: activeUser.email,
            displayName: activeUser.displayName,
            photoURL: activeUser.photoURL,
          });
        } catch (e) {
          console.warn('Game context user sync note:', e);
        }
      }
    });

    return () => unsubscribe();
  }, [loginWithFirebaseGoogle]);

  // Handle Google Sign-In with Popup
  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      setSuccessMsg(`Welcome, ${user.displayName || 'VIP Player'}! Google sign-in verified.`);
      
      const syncResult = await loginWithFirebaseGoogle({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      if (onSuccess) {
        onSuccess(user);
      }

      if (onClose) {
        setTimeout(() => onClose(), 600);
      }
    } catch (err: any) {
      console.error('Firebase Google Auth Error:', err);
      let userFriendlyMsg = err.message || 'Google authentication failed.';
      
      if (err.code === 'auth/popup-closed-by-user') {
        userFriendlyMsg = 'Sign-in window was closed before completion. Please click again to sign in.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        userFriendlyMsg = 'Multiple sign-in attempts detected. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        userFriendlyMsg = 'Google sign-in popup was blocked by browser. Please enable popups for this site.';
      } else if (err.code === 'auth/unauthorized-domain') {
        userFriendlyMsg = 'This web domain is not authorized. Please add lucent-meerkat-577ff5.netlify.app (and your current domain) in Firebase Console -> Authentication -> Settings -> Authorized domains.';
      }

      setError(userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setSuccessMsg('Signed out of Google account.');
      try {
        localStorage.removeItem('bitora_current_uid');
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
    }
  };

  return (
    <div
      className={`w-full max-w-lg mx-auto bg-[#0d111a] border-2 border-[#d4af37]/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.2)] text-white relative overflow-hidden ${className}`}
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-[#d4af37]/40 text-[#f5d061] text-[11px] font-black uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Firebase Google Authentication</span>
        </div>

        <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-white tracking-wide">
          {firebaseUser ? 'VIP ACCOUNT ACTIVE' : 'SIGN IN WITH GOOGLE'}
        </h2>

        <p className="text-xs text-gray-300 max-w-sm mx-auto">
          {firebaseUser
            ? 'Your Google account is verified. All casino games, cashier, and wallet controls are unlocked.'
            : 'Access the luxury casino simulation suite. Click below to authenticate instantly with your Google account.'}
        </p>
      </div>

      {/* Welcome Bonus Notice (110 Credits) */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#f5d061]/20 to-amber-500/15 border border-[#d4af37]/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black text-sm shadow">
            🎁
          </div>
          <div>
            <p className="text-xs font-black text-[#f5d061] uppercase tracking-wide flex items-center gap-1">
              <span>110 Credits Bonus</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </p>
            <p className="text-[11px] text-gray-200">
              Granted immediately upon initial Google verification.
            </p>
          </div>
        </div>
        <span className="font-mono-numbers font-black text-xs text-black bg-[#f5d061] px-2.5 py-1 rounded-xl shrink-0 shadow">
          +110
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-xs text-red-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span className="leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* Sign-In View or Authenticated View */}
      {!firebaseUser ? (
        <div className="space-y-4">
          {/* Exclusive Sign In with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-white hover:bg-gray-50 text-gray-900 shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            {loading ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin text-gray-700" />
                <span className="text-gray-700">Connecting to Google...</span>
              </>
            ) : (
              <>
                {/* Official Google Multi-color G logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
                <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
              </>
            )}
          </button>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Secure popup authentication &bull; No passwords or SMS required</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Google User Details */}
          <div className="p-4 rounded-2xl bg-[#141b27] border border-[#242c3d] flex items-center gap-4">
            <img
              src={
                firebaseUser.photoURL ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
              }
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-[#f5d061] shadow"
            />
            <div className="overflow-hidden flex-1">
              <p className="font-bold text-white text-sm truncate">
                {firebaseUser.displayName || 'VIP Player'}
              </p>
              <p className="text-xs text-gray-400 font-mono truncate">
                {firebaseUser.email || firebaseUser.uid}
              </p>
              <span className="inline-block mt-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Google Verified ✓
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] text-black font-black text-xs tracking-wider uppercase cursor-pointer transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-95"
              >
                Enter Games Lobby
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="py-3 px-4 rounded-xl bg-[#1a2233] hover:bg-red-500/20 hover:text-red-300 border border-[#2d3b55] hover:border-red-500/40 text-xs font-bold text-gray-300 transition-colors cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthLogin;

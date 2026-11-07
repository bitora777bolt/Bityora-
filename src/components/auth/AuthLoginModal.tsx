import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleAuthLogin } from './GoogleAuthLogin';
import { User } from 'firebase/auth';
import { Lock, X } from 'lucide-react';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user?: User) => void;
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
        className={`relative w-full min-w-[320px] sm:min-w-[480px] md:min-w-[560px] max-w-xl md:max-w-2xl min-h-[440px] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto my-auto rounded-3xl border-2 border-[#d4af37]/60 bg-[#0b0e17] shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.25)] flex flex-col justify-start animate-in zoom-in-95 duration-200 p-5 sm:p-8 ${className}`}
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#242c3d]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-[#d4af37]/40 text-[#f5d061] text-[10px] font-black uppercase tracking-wider">
              <Lock className="w-3 h-3 text-[#f5d061]" />
              <span>Google Verification Required</span>
            </div>
            <h2 id="auth-modal-title" className="font-cinzel text-lg sm:text-2xl font-black text-white tracking-wide">
              {title || (requiredForGame ? `UNLOCK & PLAY ${requiredForGame.toUpperCase()}` : 'SIGN IN WITH GOOGLE')}
            </h2>
            <p className="text-xs text-gray-300">
              {subtitle || (requiredForGame
                ? `Google authentication is required before you can access or play ${requiredForGame}.`
                : 'Sign in with your verified Google account to play games and claim your welcome bonus.')}
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

        {/* Google Authentication Component */}
        <div className="mt-2 flex-1">
          <GoogleAuthLogin
            onSuccess={(u) => {
              if (onSuccess) onSuccess(u);
              onClose();
            }}
            className="border-0 bg-transparent shadow-none p-0 min-h-0"
          />
        </div>
      </div>
    </div>
  );

  if (mounted && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default AuthLoginModal;

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PhoneAuthLogin } from './PhoneAuthLogin';
import { User } from 'firebase/auth';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
  className?: string;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
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

  // Ensure any existing RecaptchaVerifier instance is properly checked and destroyed before re-render
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

      {/* 
        PROPER MODAL CONTAINER WITH EXPLICIT MINIMUM DIMENSIONS 
        - Guaranteed on top of all page elements (fixed positioning, z-index: 99999, React DOM portal to document.body)
        - Minimum Width: prevents collapsing into a narrow horizontal strip (min-w-[320px] sm:min-w-[480px] md:min-w-[560px])
        - Minimum Height: prevents vertical collapse (min-h-[480px] sm:min-h-[540px])
        - Distinct Maximum Width & Maximum Height constraints for full responsiveness
      */}
      <div
        className={`relative w-full min-w-[320px] sm:min-w-[480px] md:min-w-[560px] max-w-xl md:max-w-2xl min-h-[480px] sm:min-h-[540px] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto my-auto rounded-3xl border-2 border-[#d4af37]/60 bg-[#0b0e17] shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.25)] flex flex-col justify-start animate-in zoom-in-95 duration-200 ${className}`}
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <PhoneAuthLogin
          onClose={onClose}
          onSuccess={(u) => {
            if (onSuccess) onSuccess(u);
          }}
          className="w-full min-h-[480px] sm:min-h-[540px] border-0 bg-transparent shadow-none p-5 sm:p-8 md:p-10 flex flex-col justify-between"
        />
      </div>
    </div>
  );

  if (mounted && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default AuthLoginModal;

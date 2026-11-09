import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Shield, Lock, X, CheckCircle2, AlertCircle, KeyRound, UserCheck } from 'lucide-react';

interface ScannerAuthorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: () => void;
}

const AUTHORIZED_PINS = ['778899', '889900', 'ADMIN2026', 'BITORA777', '123456'];

export const ScannerAuthorityModal: React.FC<ScannerAuthorityModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
}) => {
  const { currentUser, loginAs } = useGame();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = pin.trim();
    if (!trimmed) {
      setError('Please enter the owner master security PIN.');
      return;
    }

    if (AUTHORIZED_PINS.includes(trimmed)) {
      sessionStorage.setItem('bitora_scanner_authorized', 'true');
      onAuthorized();
      onClose();
    } else {
      setError('Invalid authority PIN! Only platform administrators or authorized owners are permitted.');
    }
  };

  const handleAdminOneClick = () => {
    loginAs('ADM-JATIN-01');
    sessionStorage.setItem('bitora_scanner_authorized', 'true');
    onAuthorized();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0e121a] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.25)] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black font-black shadow-lg shrink-0">
            <Lock className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                AUTHORITY REQUIRED
              </span>
            </div>
            <h3 className="font-cinzel text-lg font-black text-white mt-0.5">
              REPLACE SCANNER PHOTO
            </h3>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          Security policy: Only <strong>authorized administrators</strong> or users with the <strong>Master Owner PIN</strong> are permitted to replace or modify the payment QR scanner photo.
        </p>

        {/* Option 1: Enter Master Owner PIN */}
        <form onSubmit={handleVerifyPin} className="space-y-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#f5d061]" />
              <span>Enter Master Owner Security PIN:</span>
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 778899 or ADMIN2026"
              className="w-full bg-[#182030] border-2 border-[#2d3b55] focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm font-mono text-white tracking-widest focus:outline-none"
              autoFocus
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Authorized Demo PINs: <code className="text-amber-300 font-mono">778899</code> or <code className="text-amber-300 font-mono">ADMIN2026</code>
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl text-xs bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-black text-black bg-gradient-to-r from-amber-400 via-[#f5d061] to-yellow-500 hover:brightness-110 shadow-md transition-all cursor-pointer text-xs uppercase tracking-wider"
          >
            Authorize &amp; Select File
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#242c3d] w-full" />
          <span className="bg-[#0e121a] px-3 text-[10px] uppercase font-bold text-gray-500 relative">
            OR SWITCH ROLE
          </span>
        </div>

        {/* Option 2: One-click Admin Verification */}
        <button
          type="button"
          onClick={handleAdminOneClick}
          className="w-full py-2.5 rounded-xl bg-[#182030] hover:bg-[#222d42] border border-amber-500/40 text-xs font-bold text-amber-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Authorize as Platform Administrator (ADM-BITORA-01)</span>
        </button>
      </div>
    </div>
  );
};

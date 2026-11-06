import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Coins, X, CheckCircle, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface CashierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashierModal: React.FC<CashierModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, topUpVirtualCredits } = useGame();
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentBal = currentUser?.balance || 0;
  const maxCap = 5000;
  const remainingSpace = Math.max(0, maxCap - currentBal);

  // Deposit choices: 110, 200, 400, 800, 1000, 1600, and 5,000 max
  const PRESET_CHOICES = [
    { value: 110, label: '₹110', sub: '110 Credits', tag: 'Starter' },
    { value: 200, label: '₹200', sub: '200 Credits', tag: 'Popular' },
    { value: 400, label: '₹400', sub: '400 Credits', tag: 'Standard' },
    { value: 800, label: '₹800', sub: '800 Credits', tag: 'Gold' },
    { value: 1000, label: '₹1,000', sub: '1,000 Credits', tag: 'High-Roller' },
    { value: 1600, label: '₹1,600', sub: '1,600 Credits', tag: 'VIP Suite' },
    { value: 5000, label: '₹5,000', sub: 'Max Demo Cap', tag: 'Max Limit' },
  ];

  const handleTopUp = (amountToUse?: number) => {
    setMessage(null);
    let amount = amountToUse !== undefined ? amountToUse : selectedAmount;

    if (customAmount && amountToUse === undefined) {
      const parsed = parseInt(customAmount, 10);
      if (isNaN(parsed) || parsed <= 0) {
        setMessage({ type: 'error', text: 'Please enter a valid numeric credit amount.' });
        return;
      }
      amount = parsed;
    }

    if (amount < 10) {
      setMessage({ type: 'error', text: 'Minimum demo top-up amount is ₹10.' });
      return;
    }

    if (currentBal >= maxCap) {
      setMessage({
        type: 'error',
        text: 'Your demo balance is already at the maximum limit of ₹5,000. Spend credits in demo games to top up again.',
      });
      return;
    }

    const result = topUpVirtualCredits(amount);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setCustomAmount('');
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleFillToMax = () => {
    if (remainingSpace > 0) {
      handleTopUp(remainingSpace);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col justify-center items-center py-6 sm:py-10 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-[#0e121a] border border-[#d4af37]/40 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.2)] p-6 sm:p-8 my-auto overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Subtle Background Radial Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5d061] to-[#8c7322] flex items-center justify-center text-black shadow-lg">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-black gold-text-gradient">
              Demo Cashier (Virtual Credits)
            </h2>
            <p className="text-xs text-gray-400">
              Virtual Entertainment Credits &bull; Zero Real-Money Value
            </p>
          </div>
        </div>

        {/* Account Balance Headroom Monitor */}
        <div className="bg-[#151b26] border border-[#242c3d] rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-300">Current Demo Balance:</span>
            <span className="font-mono-numbers text-lg font-black text-[#f5d061]">
              ₹{currentBal.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Progress Bar towards ₹5,000 max */}
          <div className="w-full h-2.5 bg-[#090c12] rounded-full overflow-hidden border border-[#242c3d]">
            <div
              className="h-full bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, (currentBal / maxCap) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-2 text-[11px] text-gray-400 font-mono-numbers">
            <span>Min Top-Up: ₹100</span>
            <span>Room Remaining: <strong className="text-emerald-400">₹{remainingSpace.toLocaleString('en-IN')}</strong></span>
            <span>Max Cap: ₹5,000</span>
          </div>
        </div>

        {/* Alert Messages */}
        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 mb-5 ${
              message.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-300 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Preset Packages */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2.5">
            Select Demo Package (Options):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRESET_CHOICES.map(pkg => {
              const exceedsRoom = currentBal + pkg.value > maxCap && currentBal < maxCap;
              const isSelected = selectedAmount === pkg.value && !customAmount;

              return (
                <button
                  key={pkg.value}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(pkg.value);
                    setCustomAmount('');
                    setMessage(null);
                  }}
                  className={`relative p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#d4af37]/20 to-[#d4af37]/5 border-[#f5d061] shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                      : 'bg-[#121622] border-[#242c3d] hover:border-[#d4af37]/40 text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono-numbers text-base font-black text-white">
                      {pkg.label}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#f5d061]">
                      {pkg.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">{pkg.sub}</p>
                  {exceedsRoom && (
                    <span className="text-[9px] text-amber-400 block mt-1 font-semibold">
                      *Capped at max
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Fill to Max Button */}
            <button
              type="button"
              onClick={handleFillToMax}
              disabled={remainingSpace <= 0}
              className="p-3 rounded-xl text-left border border-dashed border-[#d4af37]/50 bg-[#121622]/60 hover:bg-[#d4af37]/10 text-gray-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-1.5 text-[#f5d061] text-xs font-bold mb-1">
                <Zap className="w-3.5 h-3.5" />
                Fill to ₹5,000
              </div>
              <p className="text-[10px] text-gray-400">
                Add +₹{remainingSpace.toLocaleString('en-IN')}
              </p>
            </button>
          </div>
        </div>

        {/* Custom Amount Option */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">
            Or Enter Custom Amount (Min ₹10, Max ₹5,000):
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">
              ₹
            </span>
            <input
              type="number"
              min={10}
              max={5000}
              placeholder="e.g. 750"
              value={customAmount}
              onChange={e => {
                setCustomAmount(e.target.value);
                setMessage(null);
              }}
              className="w-full bg-[#121622] border border-[#242c3d] rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono-numbers text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleTopUp()}
          disabled={currentBal >= maxCap}
          className="w-full py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.35)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider text-sm flex items-center justify-center gap-2"
        >
          <Coins className="w-4 h-4 text-black" />
          <span>Confirm Instant Demo Top-Up</span>
        </button>

        {/* Compliance Footer */}
        <div className="mt-4 pt-4 border-t border-[#242c3d] flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5 text-emerald-400/80">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Server Validation Active</span>
          </div>
          <span>Strict ₹5,000 Cap Enforced</span>
        </div>
      </div>
    </div>
  );
};

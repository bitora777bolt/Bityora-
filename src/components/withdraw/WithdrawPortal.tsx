import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  ArrowUpRight,
  Coins,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Building2,
  ShieldCheck,
  Zap,
  History,
  CheckCircle2,
  Lock,
  Sparkles,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

interface WithdrawPortalProps {
  onBackToGames?: () => void;
  onGoHome?: () => void;
  onSwitchToDeposit?: () => void;
}

const WITHDRAW_PRESETS = [
  { amount: 100, label: '₹100', tag: 'Minimum' },
  { amount: 200, label: '₹200', tag: 'Quick' },
  { amount: 500, label: '₹500', tag: 'Popular' },
  { amount: 1000, label: '₹1,000', tag: 'Standard' },
  { amount: 2000, label: '₹2,000', tag: 'Silver' },
  { amount: 3000, label: '₹3,000', tag: 'Gold VIP' },
  { amount: 5000, label: '₹5,000', tag: 'Max Cap' },
];

export const WithdrawPortal: React.FC<WithdrawPortalProps> = ({
  onBackToGames,
  onGoHome,
  onSwitchToDeposit,
}) => {
  const { currentUser, submitWithdrawal, withdrawalHistory } = useGame();

  const currentBal = currentUser?.balance || 0;
  const [withdrawAmount, setWithdrawAmount] = useState<number>(() => Math.min(500, currentBal || 100));
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'BANK'>('UPI');
  const [upiId, setUpiId] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>(currentUser?.username || '');
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [lastSuccessTxn, setLastSuccessTxn] = useState<{ id: string; amount: number; dest: string } | null>(null);

  const handlePercentageSelect = (percent: number) => {
    const calc = Math.floor((currentBal * percent) / 100);
    setWithdrawAmount(Math.max(1, calc));
    setMsg(null);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (withdrawAmount <= 0) {
      setMsg({ text: 'Please enter a valid withdrawal amount.', isError: true });
      return;
    }

    if (currentBal < withdrawAmount) {
      setMsg({
        text: `Insufficient balance! Your available balance is ₹${currentBal.toLocaleString('en-IN')}.`,
        isError: true,
      });
      return;
    }

    let destination = '';
    if (payoutMethod === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setMsg({ text: 'Please enter a valid UPI ID (e.g. name@okhdfcbank or phone@paytm).', isError: true });
        return;
      }
      destination = `UPI: ${upiId.trim()}`;
    } else {
      if (!bankAccount.trim() || !ifscCode.trim()) {
        setMsg({ text: 'Please enter your Bank Account Number and IFSC Code.', isError: true });
        return;
      }
      destination = `Bank A/C: ${bankAccount.trim()} (IFSC: ${ifscCode.trim().toUpperCase()}) - ${accountHolder.trim()}`;
    }

    const res = submitWithdrawal(withdrawAmount, destination);
    setMsg({ text: res.message, isError: !res.success });

    if (res.success) {
      setLastSuccessTxn({
        id: `WTH-${Date.now().toString().slice(-6)}`,
        amount: withdrawAmount,
        dest: destination,
      });
      setWithdrawAmount(Math.min(500, Math.max(0, currentBal - withdrawAmount)));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#171306] via-[#241c08] to-[#120f04] border-2 border-[#d4af37]/45 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(212,175,55,0.18)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#f5d061] uppercase tracking-widest bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              OFFICIAL PAYOUT PORTAL
            </span>
            <span className="text-[11px] text-gray-400">&bull; Instant Winnings Withdrawal</span>
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide">
            WITHDRAW FUNDS &amp; PAYOUTS
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
            Withdraw your winnings directly to your UPI ID or Bank Account with 0% deduction fees.
          </p>
        </div>

        {/* User Balance & Navigation Actions */}
        <div className="flex items-center gap-3 relative z-10 self-start md:self-center">
          <div className="bg-[#090c14] border border-[#d4af37]/40 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-inner">
            <Coins className="w-5 h-5 text-[#f5d061] animate-pulse" />
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
                Available to Withdraw
              </p>
              <p className="font-mono-numbers text-xl font-black text-[#f5d061]">
                ₹{currentBal.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {onBackToGames && (
            <button
              onClick={onBackToGames}
              className="px-4 py-3 rounded-2xl bg-[#182030] hover:bg-[#222e44] border border-[#2d3b55] text-xs font-bold text-gray-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Games</span>
            </button>
          )}

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="hidden sm:flex px-4 py-3 rounded-2xl bg-[#182030] hover:bg-[#222e44] border border-[#2d3b55] text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              Home
            </button>
          )}
        </div>
      </div>

      {/* Cashier Mode Switcher Tabs (Deposit vs Withdraw) */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#0a0d14] border border-[#242c3d] rounded-2xl">
        <button
          type="button"
          onClick={onSwitchToDeposit}
          className="py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-gray-400 hover:text-white hover:bg-white/5"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>+ Deposit Funds (Select ₹110 - ₹5,000)</span>
        </button>

        <button
          type="button"
          className="py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-amber-500 via-[#f5d061] to-yellow-500 text-black shadow-[0_0_20px_rgba(245,208,97,0.35)]"
        >
          <ArrowUpRight className="w-4 h-4 text-black" />
          <span>↑ Withdraw Funds (Instant Payout)</span>
        </button>
      </div>

      {/* Main Expansive Withdrawal Form */}
      <form onSubmit={handleWithdrawSubmit} className="space-y-6">
        <div className="bg-[#0e121a] border-2 border-[#242c3d] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header & Quick Balance Percentage Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242c3d] pb-5">
            <div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <ArrowUpRight className="w-6 h-6 text-[#f5d061]" />
                SELECT WITHDRAWAL AMOUNT
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Choose an amount preset or enter custom amount up to your available balance.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#121622] p-1.5 rounded-2xl border border-[#242c3d] self-start sm:self-auto">
              <span className="text-[10px] text-gray-400 font-bold px-2 uppercase">Quick %:</span>
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentageSelect(pct)}
                  disabled={currentBal <= 0}
                  className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-[#182030] hover:bg-amber-500 hover:text-black border border-[#2d3b55] text-[#f5d061] transition-all cursor-pointer disabled:opacity-40"
                >
                  {pct === 100 ? 'ALL IN' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Presets Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
              Popular Withdrawal Amounts:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {WITHDRAW_PRESETS.map((preset) => {
                const isSelected = withdrawAmount === preset.amount;
                const isAffordable = currentBal >= preset.amount;
                return (
                  <button
                    key={preset.amount}
                    type="button"
                    onClick={() => {
                      setWithdrawAmount(preset.amount);
                      setMsg(null);
                    }}
                    className={`p-4 rounded-2xl text-center cursor-pointer transition-all border flex flex-col items-center justify-center relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#3a2c0c] via-[#241a06] to-[#120d03] border-amber-400 text-white font-black shadow-[0_0_25px_rgba(245,208,97,0.4)] scale-[1.04] ring-2 ring-amber-400'
                        : isAffordable
                        ? 'bg-[#121622] text-gray-200 hover:text-white border-[#242c3d] hover:border-[#3d4b63] hover:bg-[#161c2c]'
                        : 'bg-[#0f131a]/60 text-gray-500 border-[#1f2633]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#f5d061] text-black flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                    )}
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 ${
                        isSelected
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : 'bg-[#1a2233] text-gray-400'
                      }`}
                    >
                      {preset.tag}
                    </span>
                    <span className="font-mono-numbers text-xl font-black text-[#f5d061]">
                      {preset.label}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">
                      {isAffordable ? 'Available' : 'Above Balance'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Input Box */}
          <div className="bg-[#121622] p-5 rounded-2xl border border-[#242c3d] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300">
                Or Type Custom Withdrawal Amount:
              </label>
              <span className="text-xs text-amber-300 font-mono-numbers">
                Max Allowed: ₹{currentBal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl text-[#f5d061]">
                ₹
              </span>
              <input
                type="number"
                min={1}
                max={currentBal}
                value={withdrawAmount || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val)) {
                    setWithdrawAmount(0);
                  } else {
                    setWithdrawAmount(Math.max(0, val));
                  }
                  setMsg(null);
                }}
                className="w-full bg-[#182030] border-2 border-[#2d3b55] focus:border-amber-500 rounded-2xl pl-10 pr-4 py-3.5 text-lg font-mono-numbers font-black text-white focus:outline-none"
                placeholder="Enter withdrawal amount in Rupees..."
              />
            </div>
          </div>

          {/* Payout Destination Selector: UPI vs Bank Account */}
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
              Select Payout Receiving Method:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayoutMethod('UPI')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-3.5 ${
                  payoutMethod === 'UPI'
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-400 text-white ring-1 ring-amber-400'
                    : 'bg-[#121622] border-[#242c3d] text-gray-300 hover:text-white'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    payoutMethod === 'UPI' ? 'bg-[#f5d061] text-black' : 'bg-[#182030] text-gray-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Instant UPI Transfer</p>
                  <p className="text-xs text-gray-400">Google Pay, PhonePe, Paytm, BHIM</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod('BANK')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-3.5 ${
                  payoutMethod === 'BANK'
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-400 text-white ring-1 ring-amber-400'
                    : 'bg-[#121622] border-[#242c3d] text-gray-300 hover:text-white'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    payoutMethod === 'BANK' ? 'bg-[#f5d061] text-black' : 'bg-[#182030] text-gray-300'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Direct Bank Account Transfer</p>
                  <p className="text-xs text-gray-400">IMPS / NEFT directly to Indian bank</p>
                </div>
              </button>
            </div>

            {/* UPI Input Details */}
            {payoutMethod === 'UPI' && (
              <div className="bg-[#121622] p-5 rounded-2xl border border-[#242c3d] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300">
                    Recipient Virtual Payment Address (UPI ID):
                  </label>
                  <span className="text-[10px] text-gray-400">e.g. mobile@paytm or name@okaxis</span>
                </div>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="Enter your UPI ID (e.g. 9876543210@paytm or rahul@okhdfcbank)"
                  className="w-full bg-[#182030] border border-[#2d3b55] focus:border-amber-500 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none"
                />
              </div>
            )}

            {/* Bank Details Input */}
            {payoutMethod === 'BANK' && (
              <div className="bg-[#121622] p-5 rounded-2xl border border-[#242c3d] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Bank Account Number:
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="e.g. 50100291029301"
                      className="w-full bg-[#182030] border border-[#2d3b55] focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      IFSC Code:
                    </label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full bg-[#182030] border border-[#2d3b55] focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs font-mono uppercase text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Account Holder Name:
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Full Name as per Bank Records"
                    className="w-full bg-[#182030] border border-[#2d3b55] focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Security & Payout Notice */}
          <div className="bg-[#121622] p-4 rounded-2xl border border-[#242c3d] flex items-center gap-3 text-xs text-gray-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p>
              Withdrawals are processed 24x7 with <strong>zero platform commission fees</strong>. Funds are debited immediately from your balance upon submission.
            </p>
          </div>

          {/* Feedback Message */}
          {msg && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 ${
                msg.isError
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {msg.isError ? (
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              ) : (
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Big Submit Button */}
          <button
            type="submit"
            disabled={currentBal < withdrawAmount || withdrawAmount <= 0}
            className="w-full py-5 rounded-2xl font-black text-black text-base sm:text-lg bg-gradient-to-r from-amber-400 via-[#f5d061] to-yellow-500 hover:brightness-110 shadow-[0_0_35px_rgba(245,208,97,0.4)] transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="w-6 h-6 text-black" />
            <span>CONFIRM WITHDRAWAL OF ₹{withdrawAmount.toLocaleString('en-IN')}</span>
          </button>
        </div>
      </form>

      {/* Success Receipt Banner if just withdrawn */}
      {lastSuccessTxn && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/80 via-[#0a2016] to-emerald-950/80 border-2 border-emerald-500/60 p-6 shadow-xl space-y-2">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Withdrawal Request Submitted Successfully!</span>
          </div>
          <p className="text-xs text-gray-300">
            Reference <strong className="text-white font-mono">{lastSuccessTxn.id}</strong> for <strong className="text-emerald-400 font-mono-numbers">₹{lastSuccessTxn.amount.toLocaleString('en-IN')}</strong> sent to <span className="text-gray-200 font-mono">{lastSuccessTxn.dest}</span>.
          </p>
        </div>
      )}

      {/* Recent Withdrawals History Table */}
      <div className="bg-[#0e121a] border-2 border-[#242c3d] rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#242c3d] pb-4">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#f5d061]" />
            <h3 className="font-cinzel text-lg font-black text-white">
              RECENT WITHDRAWAL RECORDS
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-mono-numbers">
            {withdrawalHistory.length} Total Records
          </span>
        </div>

        {withdrawalHistory.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            No previous withdrawal records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242c3d] text-[10px] uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-3">Date &amp; Time</th>
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Payout Details</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242c3d]/50">
                {withdrawalHistory.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-mono-numbers text-gray-400">
                      {item.timestamp}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-300">
                      {item.id}
                    </td>
                    <td className="py-3 px-3 text-gray-300">
                      {item.note}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-black text-amber-400">
                      -₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

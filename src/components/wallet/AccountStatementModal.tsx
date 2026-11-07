import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import {
  X,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  Camera,
  Trash2,
  Home,
  Lock,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { ScannerAuthorityModal } from '../common/ScannerAuthorityModal';
import {
  loadRazorpayScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../../utils/razorpay';

interface AccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'STATEMENT' | 'DEPOSIT' | 'WITHDRAW';
  onGoHome?: () => void;
  depositResetKey?: number;
}

const DEPOSIT_PRESETS = [
  { amount: 110, label: '₹110', tag: 'Starter' },
  { amount: 200, label: '₹200', tag: 'Popular' },
  { amount: 400, label: '₹400', tag: 'Standard' },
  { amount: 800, label: '₹800', tag: 'Gold' },
  { amount: 1000, label: '₹1,000', tag: 'High-Roller' },
  { amount: 1600, label: '₹1,600', tag: 'VIP Club' },
  { amount: 5000, label: '₹5,000', tag: 'Max Limit' },
];

export const AccountStatementModal: React.FC<AccountStatementModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'STATEMENT',
  onGoHome,
  depositResetKey = 0,
}) => {
  const {
    currentUser,
    transactions,
    depositHistory,
    withdrawalHistory,
    submitDeposit,
    creditWalletFromRazorpay,
    submitWithdrawal,
    instantRefillCredits,
    ownerPaymentQr,
    updateOwnerPaymentQr,
    pendingDeposits,
    activePendingDeposit,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'STATEMENT' | 'DEPOSIT' | 'WITHDRAW'>(initialTab);
  const [statementFilter, setStatementFilter] = useState<'ALL' | 'GAMES' | 'DEPOSITS' | 'WITHDRAWALS'>('ALL');

  // Deposit Form State (Step 1: Select Amount, Step 2: Scan Owner Photo & Pay)
  const [depositStep, setDepositStep] = useState<'SELECT' | 'PAY'>('SELECT');
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [depositMethod, setDepositMethod] = useState<string>('Instant UPI / QR');
  const [depositMsg, setDepositMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [referenceUtr, setReferenceUtr] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [photoUploadMsg, setPhotoUploadMsg] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Authority check: Admin role or verified session passcode
  const isAuthorized =
    currentUser?.role === 'admin' ||
    (typeof window !== 'undefined' && sessionStorage.getItem('bitora_scanner_authorized') === 'true');

  const handleTriggerPhotoUpload = () => {
    if (isAuthorized) {
      fileInputRef.current?.click();
    } else {
      setAuthModalOpen(true);
    }
  };

  // 10-Minute Countdown Timer for QR scan & clearance
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(600);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync initial tab and step on open or when deposit button is clicked
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Whenever deposit is initiated or opened, ensure step is SELECT so all amounts are visible
      if (initialTab === 'DEPOSIT') {
        setDepositStep('SELECT');
      }
      setDepositMsg(null);
      if (activePendingDeposit) {
        const remaining = Math.max(0, Math.ceil((activePendingDeposit.releaseAt - Date.now()) / 1000));
        setQrSecondsLeft(remaining);
      } else {
        setQrSecondsLeft(600);
      }
    }
  }, [isOpen, initialTab, depositResetKey]);

  // Active 1-second countdown interval
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      if (activePendingDeposit) {
        const remaining = Math.max(0, Math.ceil((activePendingDeposit.releaseAt - Date.now()) / 1000));
        setQrSecondsLeft(remaining);
      } else if (depositStep === 'PAY') {
        setQrSecondsLeft((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activePendingDeposit, depositStep]);

  const formatMinutesSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [withdrawDestination, setWithdrawDestination] = useState<string>('');
  const [withdrawMsg, setWithdrawMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict authority check before replacing photo
    if (!isAuthorized) {
      setPhotoUploadMsg('Authority Required: Only authorized administrators or users with the Master Security PIN can replace the payment scanner photo.');
      setAuthModalOpen(true);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoUploadMsg('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const ok = updateOwnerPaymentQr(dataUrl);
      if (ok) {
        setPhotoUploadMsg('✓ Owner payment scanner photo updated successfully by authorized user!');
      } else {
        setPhotoUploadMsg('Authority check failed: Administrator credentials required.');
      }
      setTimeout(() => setPhotoUploadMsg(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('bitora.vip.pay@okhdfcbank').catch(() => {});
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  if (!isOpen) return null;

  const currentBal = currentUser?.balance || 0;

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (statementFilter === 'GAMES') {
      return (
        t.type === 'GAME_WIN' ||
        t.type === 'GAME_LOSS' ||
        t.type === 'GAME_PAYOUT' ||
        t.type === 'GAME_WAGER'
      );
    }
    if (statementFilter === 'DEPOSITS') {
      return (
        t.type === 'DEPOSIT' ||
        t.type === 'TOP_UP' ||
        t.type === 'ADMIN_GRANT' ||
        t.type === 'DEMO_PAYMENT_REQUEST'
      );
    }
    if (statementFilter === 'WITHDRAWALS') {
      return t.type === 'WITHDRAWAL' || t.type === 'ADMIN_DEDUCT';
    }
    return true;
  });

  const handleDepositSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDepositMsg(null);
    if (depositAmount <= 0) {
      setDepositMsg({ text: 'Please enter a valid deposit amount (minimum ₹10).', isError: true });
      return;
    }
    const res = submitDeposit(depositAmount, depositMethod, referenceUtr);
    setDepositMsg({ text: res.message, isError: !res.success });
    if (res.success && res.pendingDeposit) {
      setQrSecondsLeft(Math.max(0, Math.ceil((res.pendingDeposit.releaseAt - Date.now()) / 1000)));
    }
  };

  const [isPayingRazorpay, setIsPayingRazorpay] = useState<boolean>(false);
  const [razorpaySuccessReceipt, setRazorpaySuccessReceipt] = useState<{
    paymentId: string;
    orderId: string;
    amount: number;
    balanceAfter: number;
  } | null>(null);

  const handleRazorpayDeposit = async () => {
    if (!currentUser) {
      setDepositMsg({ text: 'Please sign in to proceed with deposit.', isError: true });
      return;
    }
    if (depositAmount <= 0) {
      setDepositMsg({ text: 'Please enter a valid amount (minimum ₹10).', isError: true });
      return;
    }
    if (depositAmount > 5000) {
      setDepositAmount(5000);
    }

    setIsPayingRazorpay(true);
    setDepositMsg(null);

    try {
      const orderRes = await createRazorpayOrder(
        depositAmount,
        currentUser.id,
        currentUser.email,
        currentUser.phone
      );

      const isScriptLoaded = await loadRazorpayScript();

      if (isScriptLoaded && typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.order.amount,
          currency: orderRes.order.currency || 'INR',
          name: 'BITORA VIP Gaming & Casino',
          description: `Wallet Deposit: ₹${depositAmount.toLocaleString('en-IN')}`,
          image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=128&auto=format&fit=crop&q=80',
          order_id: orderRes.order.id,
          prefill: {
            name: currentUser.username || 'VIP Player',
            email: currentUser.email || 'vip@bitora.casino',
            contact: currentUser.phone || '',
          },
          theme: {
            color: '#d4af37',
            backdrop_color: '#0b0e14',
          },
          modal: {
            ondismiss: () => {
              setIsPayingRazorpay(false);
            },
          },
          handler: async (response: any) => {
            try {
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: depositAmount,
                userId: currentUser.id,
              });

              if (verifyRes.success) {
                const creditRes = creditWalletFromRazorpay(
                  depositAmount,
                  response.razorpay_payment_id,
                  response.razorpay_order_id,
                  depositMethod
                );
                setRazorpaySuccessReceipt({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  amount: depositAmount,
                  balanceAfter: creditRes.balanceAfter,
                });
                setDepositMsg({
                  text: `🎉 ₹${depositAmount.toLocaleString('en-IN')} successfully credited to your wallet via Razorpay!`,
                });
              }
            } catch (err: any) {
              setDepositMsg({ text: err.message || 'Payment verification failed.', isError: true });
            } finally {
              setIsPayingRazorpay(false);
            }
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          setDepositMsg({ text: resp.error?.description || 'Payment cancelled or failed.', isError: true });
          setIsPayingRazorpay(false);
        });
        rzp.open();
      } else {
        throw new Error('Razorpay Checkout SDK could not be loaded. Please ensure an active internet connection and that ad-blockers are disabled.');
      }
    } catch (err: any) {
      setDepositMsg({ text: err.message || 'Payment error occurred.', isError: true });
      setIsPayingRazorpay(false);
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMsg(null);
    if (withdrawAmount <= 0) {
      setWithdrawMsg({ text: 'Please enter a valid withdrawal amount.', isError: true });
      return;
    }
    if (withdrawAmount > currentBal) {
      setWithdrawMsg({
        text: `Insufficient balance! You have ₹${currentBal.toLocaleString('en-IN')}.`,
        isError: true,
      });
      return;
    }
    const destination = withdrawDestination.trim() || 'Default Bank Account / UPI';
    const res = submitWithdrawal(withdrawAmount, destination);
    setWithdrawMsg({ text: res.message, isError: !res.success });
    if (res.success) {
      setTimeout(() => {
        setActiveTab('STATEMENT');
        setStatementFilter('WITHDRAWALS');
      }, 1000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200 flex flex-col justify-center items-center py-6 sm:py-10 px-3 sm:px-6"
      onClick={onClose}
    >
      <div
        className="bg-[#0e121a] border-2 border-[#d4af37]/60 rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.95)] my-auto flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Buttons: Back to Home & Close Button */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#182030] hover:bg-[#253046] border border-[#d4af37]/50 text-xs font-bold text-[#f5d061] hover:text-white transition-all cursor-pointer shadow-md"
              title="Return to Bitora Home Page"
            >
              <Home className="w-3.5 h-3.5 text-[#f5d061]" />
              <span>Back to Home</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#182030] hover:bg-[#253046] border border-[#242c3d] flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Header: Unified Winnings Balance Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#242c3d]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5d061] via-[#d4af37] to-[#aa820a] p-0.5 shadow-lg flex items-center justify-center text-black font-black text-xl">
              <Wallet className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel text-lg sm:text-xl font-black text-white">
                  WINNINGS BALANCE &amp; STATEMENT
                </h3>
              </div>
              <p className="text-[11px] text-gray-400">
                Unified live balance used directly for all bets &amp; payouts (No Limits)
              </p>
            </div>
          </div>

          {/* Unified Balance Highlight */}
          <div className="bg-gradient-to-r from-[#141b29] to-[#0c101a] border border-[#d4af37]/40 px-3.5 py-1.5 rounded-2xl flex items-center gap-2.5 shadow-inner">
            <Sparkles className="w-4 h-4 text-[#f5d061] animate-pulse" />
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
                Available Balance
              </p>
              <p className="font-mono-numbers text-base sm:text-lg font-black text-[#f5d061]">
                ₹{currentBal.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 my-3 p-1 bg-[#090b10] border border-[#242c3d] rounded-2xl">
          <button
            onClick={() => setActiveTab('STATEMENT')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'STATEMENT'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Account Statement</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('DEPOSIT');
              setDepositStep('SELECT');
              setDepositMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'DEPOSIT'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deposit (Add Funds)</span>
          </button>

          <button
            onClick={() => setActiveTab('WITHDRAW')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'WITHDRAW'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            <span>Withdraw</span>
          </button>
        </div>

        {/* TAB 1: ACCOUNT STATEMENT (UNIFIED HISTORY) */}
        {activeTab === 'STATEMENT' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Filter Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                Transactions Log (With Exact Seconds)
              </span>

              <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded-xl border border-[#242c3d]">
                {[
                  { id: 'ALL', label: 'All History' },
                  { id: 'GAMES', label: 'Bets & Wins' },
                  { id: 'DEPOSITS', label: 'Deposits' },
                  { id: 'WITHDRAWALS', label: 'Withdrawals' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatementFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      statementFilter === f.id
                        ? 'bg-[#d4af37] text-black font-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Statements List */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-2 max-h-[50vh]">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No statement records found for this filter.
                </div>
              ) : (
                filteredTransactions.map((item) => {
                  const isWin = item.type === 'GAME_WIN' || (item.type === 'GAME_PAYOUT' && item.amount > 0);
                  const isLoss = item.type === 'GAME_LOSS' || item.type === 'GAME_WAGER';
                  const isDeposit =
                    item.type === 'DEPOSIT' ||
                    item.type === 'TOP_UP' ||
                    item.type === 'ADMIN_GRANT' ||
                    item.type === 'DEMO_PAYMENT_REQUEST';
                  const isWithdrawal = item.type === 'WITHDRAWAL' || item.type === 'ADMIN_DEDUCT';

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#121622] border border-[#242c3d] hover:border-[#384661] transition-all"
                    >
                      {/* Left: Icon & Details */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold border ${
                            isWin
                              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400'
                              : isLoss
                              ? 'bg-rose-950/70 border-rose-500/50 text-rose-400'
                              : isDeposit
                              ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                              : 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                          }`}
                        >
                          {isWin ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : isLoss ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : isDeposit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {item.gameName || (isDeposit ? 'Deposit' : isWithdrawal ? 'Withdrawal' : 'Transaction')}
                            </span>
                            {item.status === 'PENDING' ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 animate-spin" /> PENDING (10-MIN CLEARANCE)
                              </span>
                            ) : (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  isWin
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : isLoss
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                    : isDeposit
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {isWin ? 'WON' : isLoss ? 'LOST' : isDeposit ? 'DEPOSIT' : 'WITHDRAWAL'}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{item.note}</p>

                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500 font-mono-numbers">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Resulting Balance */}
                      <div className="text-right shrink-0">
                        <p
                          className={`font-mono-numbers font-black text-sm ${
                            item.status === 'PENDING'
                              ? 'text-amber-400'
                              : isWin || isDeposit
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {item.status === 'PENDING'
                            ? `+₹${item.amount.toLocaleString('en-IN')} (Pending)`
                            : isWin || isDeposit
                            ? `+₹${item.amount.toLocaleString('en-IN')}`
                            : `-₹${item.amount.toLocaleString('en-IN')}`}
                        </p>
                        <p className="text-[10px] font-mono-numbers text-gray-400 mt-0.5">
                          {item.status === 'PENDING' ? 'Clearing in 10 mins' : `Bal: ₹${item.balanceAfter.toLocaleString('en-IN')}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Direct Deposit Link */}
            <div className="pt-2 border-t border-[#242c3d] flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Need to recharge your balance?</span>
              <button
                onClick={() => setActiveTab('DEPOSIT')}
                className="px-3 py-1.5 rounded-xl bg-[#172030] hover:bg-[#202d44] border border-[#2d3b55] text-xs font-bold text-[#f5d061] flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Go to Razorpay Deposit</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DEPOSIT (PRESETS: 110, 200, 400, 800, 1000, 1600, MAX 5000 + OWNER SCANNER PHOTO) */}
        {activeTab === 'DEPOSIT' && (
          <div className="space-y-4 py-2">
            {/* Hidden File Input for Owner to Upload Custom Payment Photo */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            {/* STEP 1: SELECT DEPOSIT AMOUNT & OWNER PHOTO STATUS */}
            {depositStep === 'SELECT' && (
              <div className="space-y-4">
                {/* Active Pending Clearance Notice if one is already processing */}
                {activePendingDeposit && (
                  <div className="bg-gradient-to-r from-amber-950/70 via-[#1c1608] to-amber-950/70 border border-amber-500/50 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-[#f5d061] animate-spin" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-300">
                          Active Deposit Pending Clearance: ₹{activePendingDeposit.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] text-gray-300">
                          Releasing in <span className="font-mono-numbers text-[#f5d061] font-bold">{formatMinutesSeconds(qrSecondsLeft)}</span>. You can select another deposit below anytime!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDepositStep('PAY')}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-black text-xs hover:brightness-110 cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                    >
                      <span>View Scanner &amp; Timer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Amount Selection Section */}
                <div className="bg-[#121622] p-4 rounded-2xl border border-[#242c3d] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200">
                      Select Deposit Amount (₹):
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                      Max Limit: ₹5,000
                    </span>
                  </div>

                  {/* Required Presets: 110, 200, 400, 800, 1000, 1600, 5000 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEPOSIT_PRESETS.map((preset) => {
                      const isSelected = depositAmount === preset.amount;
                      return (
                        <button
                          key={preset.amount}
                          type="button"
                          onClick={() => setDepositAmount(preset.amount)}
                          className={`p-2.5 rounded-xl text-center cursor-pointer transition-all border flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black border-emerald-400 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-[1.02]'
                              : 'bg-[#182030] text-gray-200 hover:text-white border-[#242c3d] hover:border-[#3d4b63]'
                          }`}
                        >
                          <span className="font-mono-numbers text-sm font-black">
                            {preset.label}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider ${
                              isSelected ? 'text-black/80' : 'text-gray-400'
                            }`}
                          >
                            {preset.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Amount Input with strictly enforced ₹5,000 limit */}
                  <div className="pt-2 border-t border-[#242c3d]/70">
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5">
                      Or Enter Custom Amount (Min ₹10 &bull; Max ₹5,000):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={10}
                        max={5000}
                        value={depositAmount || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val)) {
                            setDepositAmount(0);
                          } else {
                            setDepositAmount(Math.min(5000, Math.max(0, val)));
                          }
                        }}
                        className="w-full bg-[#182030] border border-[#2d3b55] focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono-numbers font-bold text-white focus:outline-none"
                        placeholder="Enter amount between ₹10 and ₹5,000..."
                      />
                    </div>
                  </div>
                </div>

                {/* Owner Payment Photo Upload & Management Card */}
                <div className="bg-[#121622] p-4 rounded-2xl border border-[#d4af37]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#f5d061]" />
                      <span className="text-xs font-bold text-white">
                        Owner Payment Photo (QR Scanner)
                      </span>
                    </div>
                    {ownerPaymentQr ? (
                      <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Custom Photo Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                        Default QR Active
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Website owner can upload their own payment QR scanner photo from device files. When any amount is selected and you proceed, this photo is displayed for scanning.
                  </p>

                  <div className="flex items-center gap-3">
                    {ownerPaymentQr ? (
                      <div className="flex items-center gap-3 w-full">
                        <img
                          src={ownerPaymentQr}
                          alt="Owner Payment QR"
                          className="w-14 h-14 rounded-xl object-cover border border-[#d4af37] shadow-sm shrink-0"
                        />
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-bold text-white">Your Photo is Ready</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleTriggerPhotoUpload}
                              className="px-2.5 py-1 rounded-lg bg-[#182030] hover:bg-[#202b40] border border-[#2d3b55] text-[11px] font-bold text-[#f5d061] flex items-center gap-1 cursor-pointer"
                            >
                              {isAuthorized ? <Upload className="w-3 h-3" /> : <Lock className="w-3 h-3 text-amber-400" />}
                              <span>{isAuthorized ? 'Change Photo' : 'Change Photo (Auth)'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isAuthorized) {
                                  updateOwnerPaymentQr('');
                                } else {
                                  setAuthModalOpen(true);
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-[11px] font-bold text-rose-300 flex items-center gap-1 cursor-pointer"
                              title="Reset to default QR"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleTriggerPhotoUpload}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#172030] to-[#121824] hover:from-[#202c42] hover:to-[#182030] border border-dashed border-[#d4af37]/60 text-xs font-bold text-[#f5d061] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-inner"
                      >
                        {isAuthorized ? <Upload className="w-4 h-4 text-[#f5d061]" /> : <Lock className="w-4 h-4 text-amber-400" />}
                        <span>Upload Owner Payment Scanner Photo (Admin / Owner Only)</span>
                      </button>
                    )}
                  </div>

                  {photoUploadMsg && (
                    <p className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/30">
                      {photoUploadMsg}
                    </p>
                  )}
                </div>

                {depositMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      depositMsg.isError
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {depositMsg.isError ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    )}
                    <span>{depositMsg.text}</span>
                  </div>
                )}

                {/* Razorpay Success Receipt Card (if paid) */}
                {razorpaySuccessReceipt && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-xs space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Razorpay Payment Verified &bull; Wallet Credited!</span>
                    </div>
                    <div className="flex justify-between text-gray-300 font-mono text-[11px]">
                      <span>Payment ID: {razorpaySuccessReceipt.paymentId}</span>
                      <span className="font-bold text-[#f5d061]">+₹{razorpaySuccessReceipt.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-[11px]">
                      <span>Updated Balance:</span>
                      <span className="font-mono text-emerald-300 font-bold">₹{razorpaySuccessReceipt.balanceAfter.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* Primary Razorpay Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRazorpayDeposit}
                    disabled={isPayingRazorpay}
                    className="w-full py-3.5 rounded-2xl font-black text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPayingRazorpay ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>INITIALIZING RAZORPAY...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-black" />
                        <span>PAY WITH RAZORPAY (₹{depositAmount.toLocaleString('en-IN')})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SCAN OWNER PHOTO & CONFIRM PAYMENT */}
            {depositStep === 'PAY' && (
              <div className="space-y-4">
                {/* Back & Amount Header */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121622] p-3.5 rounded-2xl border border-[#242c3d]">
                  <button
                    type="button"
                    onClick={() => {
                      setDepositStep('SELECT');
                      setDepositMsg(null);
                    }}
                    className="flex items-center justify-center gap-2 text-xs font-black text-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:brightness-110 border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer transition-all active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4 text-black" />
                    <span>← Back to Choose Other Amounts (₹110, ₹200, ₹400...)</span>
                  </button>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                        Selected Deposit Amount
                      </p>
                      <p className="font-mono-numbers text-xl font-black text-[#f5d061]">
                        ₹{depositAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Display The Owner's Photo (or default high-res QR) */}
                <div className="bg-[#0b0e14] border-2 border-[#d4af37]/70 rounded-3xl p-5 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.25)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="w-4 h-4 text-[#f5d061]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {ownerPaymentQr ? 'Owner Payment Scanner Photo' : 'UPI Payment QR Scanner'}
                    </span>
                  </div>

                  {/* Photo / QR Image */}
                  <div className="relative group bg-black/60 p-3 rounded-2xl border border-[#d4af37]/50 shadow-inner">
                    {ownerPaymentQr ? (
                      <img
                        src={ownerPaymentQr}
                        alt="Owner Payment Scanner"
                        className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
                      />
                    ) : (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                          `upi://pay?pa=bitora.vip.pay@okhdfcbank&pn=BITORA_CASINO&am=${depositAmount}&cu=INR&tn=VIP_DEPOSIT`
                        )}&color=d4af37&bgcolor=0e121a`}
                        alt="Payment QR Code"
                        className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
                      />
                    )}
                  </div>

                  {/* Text under photo: ONLY exact requested text with no numbers */}
                  <p className="text-xs sm:text-sm font-semibold text-gray-200 text-center mt-3 max-w-sm px-2">
                    Scan this QR for more money and complete your payment within 10 minutes.
                  </p>

                  {/* 10-Minute Live Countdown Timer */}
                  <div className="mt-3 w-full max-w-xs bg-[#121622] border border-[#d4af37]/40 rounded-2xl p-3 text-center shadow-lg">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                      <Clock className="w-3.5 h-3.5 text-[#f5d061] animate-spin" />
                      <span>10-Minute Clearance Timer</span>
                    </div>
                    <div className="font-mono-numbers text-3xl font-black text-[#f5d061] tracking-wider my-0.5">
                      {formatMinutesSeconds(qrSecondsLeft)}
                    </div>
                    <div className="w-full h-1.5 bg-[#090c12] rounded-full overflow-hidden border border-[#242c3d] mt-2">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-[#f5d061] to-emerald-400 transition-all duration-1000 rounded-full"
                        style={{ width: `${Math.min(100, (qrSecondsLeft / 600) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                      {activePendingDeposit
                        ? 'Bank clearance in progress. Credits will release when timer finishes.'
                        : 'Credits release strictly upon 10-minute clearance. No instant credit.'}
                    </p>
                  </div>

                  {/* Owner re-upload action right on this screen */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTriggerPhotoUpload}
                      className="px-3 py-1.5 rounded-xl bg-[#182030] hover:bg-[#222e44] border border-[#d4af37]/40 text-[11px] font-bold text-[#f5d061] flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      {isAuthorized ? <Upload className="w-3 h-3" /> : <Lock className="w-3 h-3 text-amber-400" />}
                      <span>
                        {ownerPaymentQr
                          ? isAuthorized
                            ? 'Replace Scanner Photo'
                            : 'Replace Scanner Photo (Auth Required)'
                          : isAuthorized
                          ? 'Upload Your Scanner Photo'
                          : 'Upload Your Scanner Photo (Auth Required)'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* UPI ID Details */}
                <div className="bg-[#121622] p-3 rounded-2xl border border-[#242c3d] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">
                      Pay to UPI ID:
                    </span>
                    <span className="font-mono text-xs font-black text-white">
                      bitora.vip.pay@okhdfcbank
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-2.5 py-1.5 rounded-xl bg-[#182030] hover:bg-[#202b40] border border-[#2d3b55] text-xs font-bold text-gray-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Optional UTR / Reference ID Field */}
                <div className="bg-[#121622] p-3 rounded-2xl border border-[#242c3d] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300">
                      Payment Reference / 12-Digit UTR No. (from UPI/Bank):
                    </span>
                  </div>
                  <input
                    type="text"
                    value={referenceUtr}
                    onChange={(e) => setReferenceUtr(e.target.value)}
                    placeholder="e.g. UTR281904812390 or Bank Ref"
                    className="w-full bg-[#182030] border border-[#2d3b55] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                {/* Quick Amount Switcher in Step 2 */}
                <div className="bg-[#121622] p-3 rounded-2xl border border-[#242c3d] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-300">
                      Select / Switch Deposit Amount:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositStep('SELECT');
                        setDepositMsg(null);
                      }}
                      className="text-[11px] text-[#f5d061] hover:underline font-bold cursor-pointer"
                    >
                      ← Back to Full Amount Menu
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {DEPOSIT_PRESETS.map((preset) => {
                      const isSelected = depositAmount === preset.amount;
                      return (
                        <button
                          key={preset.amount}
                          type="button"
                          onClick={() => {
                            setDepositAmount(preset.amount);
                            setDepositMsg(null);
                          }}
                          className={`py-1.5 px-1 rounded-lg text-center text-xs font-mono-numbers font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black border-emerald-400 font-black shadow-md scale-105'
                              : 'bg-[#182030] text-gray-300 hover:text-white border-[#242c3d]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {depositMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      depositMsg.isError
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {depositMsg.isError ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    ) : (
                      <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />
                    )}
                    <span>{depositMsg.text}</span>
                  </div>
                )}

                {/* Active Pending Deposit Notice or Submit Button */}
                {activePendingDeposit ? (
                  <div className="bg-gradient-to-r from-amber-950/70 via-[#1e1708] to-amber-950/70 border border-amber-500/50 rounded-2xl p-4 text-center space-y-3 shadow-xl">
                    <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
                      <Clock className="w-4 h-4 animate-spin text-amber-400" />
                      <span>10-Minute Verification in Progress</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Your deposit of <strong className="text-[#f5d061]">₹{activePendingDeposit.amount.toLocaleString('en-IN')}</strong> is being processed. It will be added to your balance in <strong className="text-[#f5d061] font-mono-numbers">{formatMinutesSeconds(qrSecondsLeft)}</strong>.
                    </p>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDepositStep('SELECT');
                          setDepositMsg(null);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer transition-all active:scale-95"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>← Choose Another Deposit Amount (₹110, ₹200, ₹400...)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('STATEMENT');
                          setStatementFilter('DEPOSITS');
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#182030] hover:bg-[#202b40] border border-[#2d3b55] text-xs font-bold text-[#f5d061] cursor-pointer"
                      >
                        View In Statement →
                      </button>

                      {onGoHome && (
                        <button
                          type="button"
                          onClick={onGoHome}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
                        >
                          Back to Home
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        handleDepositSubmit(e);
                      }}
                      className="w-full py-4 rounded-2xl font-black text-black bg-gradient-to-r from-amber-400 via-[#f5d061] to-amber-500 hover:brightness-110 shadow-[0_0_25px_rgba(245,208,97,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Clock className="w-5 h-5 text-black" />
                      <span>SUBMIT PAYMENT FOR 10-MINUTE CLEARANCE (₹{depositAmount.toLocaleString('en-IN')})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDepositStep('SELECT');
                        setDepositMsg(null);
                      }}
                      className="w-full py-3 rounded-xl bg-[#141b27] hover:bg-[#1a2333] border border-[#2d3b55] text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>← Back to Select Different Amount (₹110, ₹200, ₹400, ₹800, ₹1,000, ₹1,600, ₹5,000)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WITHDRAW (WITHDRAW FUNDS) */}
        {activeTab === 'WITHDRAW' && (
          <form onSubmit={handleWithdrawSubmit} className="space-y-4 py-2">
            <div className="bg-[#121622] p-4 rounded-2xl border border-[#242c3d] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">Withdrawal Amount (₹):</span>
                <span className="text-[11px] text-[#f5d061] font-mono-numbers">
                  Available: ₹{currentBal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Amount Presets */}
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 2500, currentBal].map((amt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWithdrawAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-mono-numbers font-bold cursor-pointer transition-all ${
                      withdrawAmount === amt
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md'
                        : 'bg-[#182030] text-gray-300 hover:text-white border border-[#242c3d]'
                    }`}
                  >
                    {idx === 3 ? 'ALL' : `₹${amt.toLocaleString('en-IN')}`}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  min={1}
                  max={currentBal}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-[#182030] border border-[#2d3b55] focus:border-amber-500 rounded-xl pl-8 pr-4 py-3 text-base font-mono-numbers font-bold text-white focus:outline-none"
                  placeholder="Enter withdrawal amount..."
                />
              </div>
            </div>

            {/* Destination Input (UPI / Bank Account) */}
            <div className="bg-[#121622] p-4 rounded-2xl border border-[#242c3d] space-y-2">
              <span className="text-xs font-bold text-gray-300">
                Recipient UPI ID / Bank Account Details:
              </span>
              <input
                type="text"
                value={withdrawDestination}
                onChange={(e) => setWithdrawDestination(e.target.value)}
                placeholder="e.g. yourname@okhdfcbank or Bank A/C & IFSC"
                className="w-full bg-[#182030] border border-[#2d3b55] focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>

            {withdrawMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  withdrawMsg.isError
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {withdrawMsg.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span>{withdrawMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={currentBal < withdrawAmount || withdrawAmount <= 0}
              className="w-full py-4 rounded-2xl font-black text-black bg-gradient-to-r from-amber-400 via-[#d4af37] to-yellow-500 hover:brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>SUBMIT WITHDRAWAL (₹{withdrawAmount.toLocaleString('en-IN')})</span>
            </button>
          </form>
        )}

        {/* Modal Footer: Quick Back to Home Option */}
        {onGoHome && (
          <div className="pt-3 mt-2 border-t border-[#242c3d] flex items-center justify-between text-xs text-gray-400">
            <span>Want to return to the casino lobby?</span>
            <button
              type="button"
              onClick={onGoHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141b27] hover:bg-[#1f2a3d] border border-[#d4af37]/40 text-[#f5d061] font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Home Page</span>
            </button>
          </div>
        )}
      </div>

      {/* Owner & Admin Authority Verification Modal */}
      <ScannerAuthorityModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthorized={() => {
          setTimeout(() => fileInputRef.current?.click(), 150);
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Coins,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  History,
  CheckCircle2,
  CreditCard,
  Building2,
  Smartphone,
  Lock,
  RotateCcw,
  AlertCircle,
  Copy,
  Check,
  Wallet,
  Activity,
  Receipt,
  Play,
  QrCode,
} from 'lucide-react';
import {
  loadRazorpayScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
  fetchRazorpayConfig,
} from '../../utils/razorpay';

interface DepositPortalProps {
  onBackToGames?: () => void;
  onGoHome?: () => void;
  onSwitchToWithdraw?: () => void;
}

const DEPOSIT_PRESETS = [
  { amount: 110, label: '₹110', tag: 'Starter', desc: '110 Credits' },
  { amount: 200, label: '₹200', tag: 'Popular', desc: '200 Credits' },
  { amount: 400, label: '₹400', tag: 'Standard', desc: '400 Credits' },
  { amount: 800, label: '₹800', tag: 'Gold VIP', desc: '800 Credits' },
  { amount: 1000, label: '₹1,000', tag: 'High-Roller', desc: '1,000 Credits' },
  { amount: 1600, label: '₹1,600', tag: 'VIP Suite', desc: '1,600 Credits' },
  { amount: 5000, label: '₹5,000', tag: 'Max Limit', desc: '5,000 Credits' },
];

const PAYMENT_METHODS = [
  { id: 'UPI', name: 'Instant UPI (GPay, PhonePe, Paytm, BHIM)', icon: Smartphone, badge: 'Zero Fee & Instant' },
  { id: 'CARDS', name: 'Cards (Visa, MasterCard, RuPay, Maestro)', icon: CreditCard, badge: 'All Indian Cards' },
  { id: 'NETBANKING', name: 'Net Banking (50+ Indian Banks)', icon: Building2, badge: 'HDFC, SBI, ICICI, Axis' },
  { id: 'WALLETS', name: 'Wallets (Mobikwik, Airtel Money, PayZapp)', icon: Wallet, badge: 'Instant Transfer' },
];

export const DepositPortal: React.FC<DepositPortalProps> = ({
  onBackToGames,
  onGoHome,
  onSwitchToWithdraw,
}) => {
  const {
    currentUser,
    creditWalletFromRazorpay,
    depositHistory,
    depositClearanceNotification,
    dismissDepositClearanceNotification,
  } = useGame();

  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [selectedMethod, setSelectedMethod] = useState<string>('Instant UPI (GPay, PhonePe, Paytm, BHIM)');
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Razorpay Gateway Config
  const [razorpayConfig, setRazorpayConfig] = useState<{
    keyId: string;
    isLiveConfigured: boolean;
    currency: string;
  } | null>(null);

  // Success Receipt State
  const [receipt, setReceipt] = useState<{
    orderId: string;
    paymentId: string;
    amount: number;
    timestamp: string;
    balanceAfter: number;
  } | null>(null);

  // Webhook Monitor Tab
  const [showWebhookMonitor, setShowWebhookMonitor] = useState<boolean>(false);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);

  // Load Razorpay Config & SDK on Mount
  useEffect(() => {
    fetchRazorpayConfig()
      .then((cfg) => setRazorpayConfig(cfg))
      .catch(() => {});
    loadRazorpayScript().catch(() => {});
    fetchWebhookOrders();
  }, []);

  const fetchWebhookOrders = async () => {
    try {
      const res = await fetch('/api/razorpay/orders');
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data.webhooks || []);
      }
    } catch {}
  };

  // Launch Official Razorpay Standard Checkout Popup
  const handleRazorpayCheckout = async () => {
    if (!currentUser) {
      setMsg({ text: 'Please sign in to proceed with deposit.', isError: true });
      return;
    }

    if (selectedAmount <= 0) {
      setMsg({ text: 'Please select or enter a valid deposit amount (min ₹10).', isError: true });
      return;
    }

    if (selectedAmount > 5000) {
      setMsg({ text: 'Maximum deposit limit is strictly capped at ₹5,000.', isError: true });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      // 1. Create order on server
      const orderRes = await createRazorpayOrder(
        selectedAmount,
        currentUser.id,
        currentUser.email,
        currentUser.phone
      );

      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Failed to initialize payment order with Razorpay.');
      }

      // 2. Ensure Razorpay client SDK is loaded
      const isScriptLoaded = await loadRazorpayScript();

      // If Razorpay SDK is present and not blocked in current browser environment:
      if (isScriptLoaded && typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.order.amount,
          currency: orderRes.order.currency || 'INR',
          name: 'BITORA VIP Gaming & Casino',
          description: `Virtual Credits Deposit: ₹${selectedAmount.toLocaleString('en-IN')}`,
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
              setLoading(false);
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // 3. Verify HMAC signature on backend
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: selectedAmount,
                userId: currentUser.id,
              });

              if (verifyRes.success) {
                // 4. Automatically credit player's wallet balance!
                const creditRes = creditWalletFromRazorpay(
                  selectedAmount,
                  response.razorpay_payment_id,
                  response.razorpay_order_id,
                  selectedMethod
                );

                setReceipt({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  amount: selectedAmount,
                  timestamp: new Date().toLocaleString('en-IN'),
                  balanceAfter: creditRes.balanceAfter,
                });
                fetchWebhookOrders();
              } else {
                setMsg({ text: 'Payment verification failed. Please contact support.', isError: true });
              }
            } catch (err: any) {
              setMsg({ text: err.message || 'Verification error occurred.', isError: true });
            } finally {
              setLoading(false);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          setMsg({
            text: resp.error?.description || 'Payment failed or was cancelled.',
            isError: true,
          });
          setLoading(false);
        });
        rzp.open();
      } else {
        throw new Error('Razorpay Checkout SDK could not be loaded. Please ensure an active internet connection and that ad-blockers are disabled.');
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Payment initiation error.', isError: true });
      setLoading(false);
    }
  };

  const currentBal = currentUser?.balance || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Cashier Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#121622] via-[#161d2d] to-[#0f1420] border-2 border-[#d4af37]/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-[#f5d061] px-2.5 py-0.5 rounded-full shadow-sm">
              RAZORPAY INTEGRATED CASHIER
            </span>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
              Instant Automatic Wallet Credit
            </span>
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide flex items-center gap-2">
            <span>DEPOSIT &amp; TOP-UP VIA RAZORPAY</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
            Choose your desired package from ₹110 to ₹5,000. Successful payments via UPI, Cards, or Net Banking automatically credit your unified wallet balance immediately.
          </p>
        </div>

        {/* User Balance & Back Quick Actions */}
        <div className="flex items-center gap-3 relative z-10 self-start md:self-center">
          <div className="bg-[#090c14] border border-[#d4af37]/40 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-inner">
            <Coins className="w-5 h-5 text-[#f5d061] animate-pulse" />
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
                Current Balance
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
          className="py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.35)]"
        >
          <Zap className="w-4 h-4 text-black fill-black" />
          <span>+ Razorpay Instant Deposit (₹110 - ₹5,000)</span>
        </button>

        <button
          type="button"
          onClick={onSwitchToWithdraw}
          className="py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-gray-400 hover:text-white hover:bg-white/5"
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>↑ Withdraw Funds (Instant Payout)</span>
        </button>
      </div>

      {/* SUCCESS RECEIPT MODAL / CARD (Triggered on Verified Razorpay Payment) */}
      {receipt && (
        <div className="rounded-3xl bg-gradient-to-b from-[#0e1e17] via-[#09150f] to-[#060e0a] border-2 border-emerald-500/70 p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.3)] animate-in zoom-in-95 duration-200 text-center space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
              RAZORPAY PAYMENT VERIFIED &bull; CREDITED
            </span>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-white mt-2">
              WALLET CREDITED WITH +₹{receipt.amount.toLocaleString('en-IN')}!
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto mt-1">
              Your payment has been cryptographically verified and added directly to your active gaming balance.
            </p>
          </div>

          {/* Receipt Details Box */}
          <div className="max-w-md mx-auto bg-[#07110c] border border-emerald-500/30 rounded-2xl p-4 text-xs space-y-2 text-left">
            <div className="flex justify-between text-gray-400">
              <span>Razorpay Payment ID:</span>
              <span className="font-mono text-emerald-300 font-bold">{receipt.paymentId}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Razorpay Order ID:</span>
              <span className="font-mono text-gray-300">{receipt.orderId}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Deposit Amount:</span>
              <span className="font-mono-numbers font-black text-[#f5d061]">+₹{receipt.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Updated Wallet Balance:</span>
              <span className="font-mono-numbers font-black text-emerald-400">
                ₹{receipt.balanceAfter.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Timestamp:</span>
              <span className="font-mono text-gray-300">{receipt.timestamp}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs sm:text-sm hover:brightness-110 cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              Make Another Deposit
            </button>

            {onBackToGames && (
              <button
                type="button"
                onClick={onBackToGames}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#182030] hover:bg-[#222e44] border border-[#d4af37]/50 text-[#f5d061] font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Play className="w-4 h-4 fill-[#f5d061]" />
                <span>Play Games Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= MAIN RAZORPAY DEPOSIT SELECTION ================= */}
      <div className="bg-[#0e121a] border-2 border-[#242c3d] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242c3d] pb-4">
          <div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Coins className="w-6 h-6 text-[#f5d061]" />
              SELECT RECHARGE PACKAGE
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Select an official preset package or enter a custom amount up to ₹5,000.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              Strict Limit: ₹5,000
            </span>
          </div>
        </div>

        {/* 7 Official Preset Cards */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
            Select Deposit Package:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {DEPOSIT_PRESETS.map((preset) => {
              const isSelected = selectedAmount === preset.amount;
              return (
                <button
                  key={preset.amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(preset.amount);
                    setMsg(null);
                  }}
                  className={`p-4 rounded-2xl text-center cursor-pointer transition-all border flex flex-col items-center justify-center relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#18392b] via-[#10241b] to-[#0a1811] border-emerald-400 text-white font-black shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-[1.04] ring-2 ring-emerald-400'
                      : 'bg-[#121622] text-gray-200 hover:text-white border-[#242c3d] hover:border-[#3d4b63] hover:bg-[#161c2c]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-400 text-black flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                  )}
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 ${
                      isSelected
                        ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-[#1a2233] text-gray-400'
                    }`}
                  >
                    {preset.tag}
                  </span>
                  <span className="font-mono-numbers text-xl font-black text-[#f5d061]">
                    {preset.label}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">
                    {preset.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div className="bg-[#121622] p-5 rounded-2xl border border-[#242c3d] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-gray-300">
              Or Enter Custom Amount (Min ₹10 &bull; Max ₹5,000):
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[110, 200, 400, 800, 1000, 1600, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelectedAmount(amt)}
                  className="px-2 py-1 rounded-lg bg-[#182030] hover:bg-[#222d42] border border-[#2d3b55] text-[10px] font-mono-numbers font-bold text-gray-300 hover:text-white cursor-pointer"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl text-[#f5d061]">
              ₹
            </span>
            <input
              type="number"
              min={10}
              max={5000}
              value={selectedAmount || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val)) {
                  setSelectedAmount(0);
                } else {
                  setSelectedAmount(Math.min(5000, Math.max(0, val)));
                }
              }}
              className="w-full bg-[#182030] border-2 border-[#2d3b55] focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-3.5 text-lg font-mono-numbers font-black text-white focus:outline-none"
              placeholder="Enter amount between ₹10 and ₹5,000..."
            />
          </div>
        </div>

        {/* Payment Channels Supported by Razorpay Gateway */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
            Select Payment Method (Supported natively via Razorpay):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PAYMENT_METHODS.map((pm) => {
              const isSelected = selectedMethod === pm.name;
              const Icon = pm.icon;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setSelectedMethod(pm.name)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-400 text-white ring-1 ring-emerald-400'
                      : 'bg-[#121622] border-[#242c3d] text-gray-300 hover:text-white hover:bg-[#161c2c]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-400 text-black' : 'bg-[#182030] text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate text-white">{pm.name}</p>
                    <span className="text-[10px] text-[#f5d061] font-medium">{pm.badge}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trust Badges & Gateway Security Info */}
        <div className="bg-[#121622] p-4 rounded-2xl border border-[#242c3d] flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-gray-300">Razorpay Verified Gateway</span>
            <span className="text-gray-600">&bull;</span>
            <span>256-bit SSL Bank Encryption</span>
            <span className="text-gray-600">&bull;</span>
            <span>RBI Compliant &amp; PCI-DSS Level 1</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400">
            <span>Gateway Mode:</span>
            <span className="bg-[#1a2233] px-2.5 py-0.5 rounded text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Production
            </span>
          </div>
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
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Primary Checkout Action */}
        <div className="pt-2">
          {/* Official Razorpay Checkout Button */}
          <button
            type="button"
            onClick={handleRazorpayCheckout}
            disabled={loading}
            className="w-full py-4 sm:py-5 rounded-2xl font-black text-black text-base sm:text-lg bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                <span>INITIALIZING RAZORPAY CHECKOUT...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-black" />
                <span>PAY NOW WITH RAZORPAY (₹{selectedAmount.toLocaleString('en-IN')})</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= RAZORPAY WEBHOOK MONITOR ================= */}
      <div className="bg-[#0e121a] border-2 border-[#242c3d] rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#242c3d] pb-4">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-cinzel text-lg font-black text-white">
                RAZORPAY WEBHOOK INTEGRATION MONITOR
              </h3>
              <p className="text-xs text-gray-400">
                Webhook listener active at <code className="text-emerald-300 font-mono">/api/razorpay/webhook</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowWebhookMonitor(!showWebhookMonitor)}
            className="text-xs font-bold text-[#f5d061] hover:underline cursor-pointer"
          >
            {showWebhookMonitor ? 'Hide Webhook Details' : 'View Live Webhook Details'}
          </button>
        </div>

        {showWebhookMonitor && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#121622] rounded-2xl border border-[#242c3d]">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Webhook Endpoint</p>
                <p className="font-mono text-xs text-emerald-400 font-bold truncate mt-1">
                  POST /api/razorpay/webhook
                </p>
              </div>

              <div className="p-3.5 bg-[#121622] rounded-2xl border border-[#242c3d]">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Handled Events</p>
                <p className="font-mono text-xs text-white font-bold mt-1">
                  payment.captured, order.paid
                </p>
              </div>

              <div className="p-3.5 bg-[#121622] rounded-2xl border border-[#242c3d]">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Signature Verification</p>
                <p className="font-mono text-xs text-amber-300 font-bold mt-1">
                  HMAC-SHA256 (x-razorpay-signature)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchWebhookOrders}
                className="px-4 py-2 rounded-xl bg-[#182030] hover:bg-[#222e44] text-xs font-bold text-gray-300 border border-[#2d3b55] cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Live Logs</span>
              </button>
            </div>

            {/* Recent Webhook Events */}
            <div className="pt-2">
              <p className="text-xs font-bold text-gray-300 mb-2">Recent Webhook Deliveries:</p>
              {webhookLogs.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No webhook deliveries recorded yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {webhookLogs.slice(0, 5).map((log, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#121622] border border-[#242c3d] flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-white font-bold">{log.event}</span>
                        <span className="text-gray-400">({log.paymentId})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#f5d061] font-bold">+₹{log.amount}</span>
                        <span className="text-emerald-400 text-[10px]">Verified ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= RECENT DEPOSITS STATEMENT TABLE ================= */}
      <div className="bg-[#0e121a] border-2 border-[#242c3d] rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#242c3d] pb-4">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#f5d061]" />
            <h3 className="font-cinzel text-lg font-black text-white">
              RECENT DEPOSIT &amp; RECHARGE RECORDS
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-mono-numbers">
            {depositHistory.length} Total Records
          </span>
        </div>

        {depositHistory.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            No previous deposit records found. Select a package above to make your first Razorpay recharge!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242c3d] text-[10px] uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-3">Date &amp; Time</th>
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242c3d]/50">
                {depositHistory.slice(0, 10).map((item) => (
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
                    <td className="py-3 px-3 text-right font-mono-numbers font-black text-emerald-400">
                      +₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
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

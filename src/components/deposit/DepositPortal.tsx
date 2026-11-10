import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Coins,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Wallet,
  AlertCircle,
  QrCode,
  Upload,
  Image as ImageIcon,
  Clock,
  X,
  Eye,
  Lock,
} from 'lucide-react';
import { DepositRequest, PaymentMethodType, isHardcodedAdminEmail } from '../../types';

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

export const DepositPortal: React.FC<DepositPortalProps> = ({
  onBackToGames,
  onGoHome,
  onSwitchToWithdraw,
}) => {
  const {
    currentUser,
    depositRequests,
    submitDepositRequest,
    paymentMethodConfigs,
    updateMethodPaymentQr,
  } = useGame();

  // Selected Payment Method: explicitly 'gpay', 'phonepe', or 'paytm'
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('gpay');

  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmountInput, setCustomAmountInput] = useState<string>('1000');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);

  // Form fields
  const [playerIdInput, setPlayerIdInput] = useState<string>(() => {
    return currentUser?.id || currentUser?.gameAccountId || '';
  });
  const [utrInput, setUtrInput] = useState<string>('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [screenshotSize, setScreenshotSize] = useState<string>('');
  const [screenshotPreviewOpen, setScreenshotPreviewOpen] = useState<boolean>(false);
  const [modalPreviewImage, setModalPreviewImage] = useState<string>('');

  // Status & Confirmation
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<DepositRequest | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const adminQrFileInputRef = useRef<HTMLInputElement>(null);

  // Strict Admin Check: Only true when logged in as an admin
  const isAdmin = Boolean(
    currentUser && (currentUser.role === 'admin' || isHardcodedAdminEmail(currentUser.email))
  );

  // Admin-only QR & UPI ID Editor state (completely hidden from regular players)
  const [showAdminQrEditor, setShowAdminQrEditor] = useState<boolean>(false);
  const [adminQrUrlInput, setAdminQrUrlInput] = useState<string>('');
  const [adminUpiIdInput, setAdminUpiIdInput] = useState<string>('');
  const [adminPayeeNameInput, setAdminPayeeNameInput] = useState<string>('');
  const [adminSaveFeedback, setAdminSaveFeedback] = useState<string | null>(null);

  // Ensure Player ID updates if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setPlayerIdInput(currentUser.id);
    }
  }, [currentUser]);

  // Current active method configuration
  const currentConfig =
    paymentMethodConfigs[selectedMethod] || paymentMethodConfigs.gpay;

  // Sync Admin Editor inputs when selectedMethod or currentConfig changes
  useEffect(() => {
    if (currentConfig) {
      setAdminUpiIdInput(currentConfig.upiId || '');
      setAdminPayeeNameInput(currentConfig.payeeName || '');
      setAdminQrUrlInput('');
    }
  }, [selectedMethod, currentConfig.upiId, currentConfig.payeeName]);

  // Admin-only QR image file upload handler
  const handleAdminQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setAdminQrUrlInput(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Admin-only save QR & UPI ID handler
  const handleAdminSaveQrAndUpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const finalQrUrl = adminQrUrlInput.trim() || currentConfig.qrImageUrl;
    const finalUpiId = adminUpiIdInput.trim() || currentConfig.upiId;
    const finalPayee = adminPayeeNameInput.trim() || currentConfig.payeeName;

    const ok = updateMethodPaymentQr(
      selectedMethod,
      finalQrUrl,
      finalUpiId,
      finalPayee,
      currentConfig.instructions
    );

    if (ok) {
      setAdminSaveFeedback(
        `${currentConfig.name} QR Code & UPI ID (${finalUpiId}) updated and synced!`
      );
      setAdminQrUrlInput('');
      setTimeout(() => setAdminSaveFeedback(null), 4000);
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmountInput(amount.toString());
    setErrorMessage(null);
  };

  // Handle Custom Amount change
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmountInput(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setSelectedAmount(Math.min(5000, num));
    }
  };

  // Copy helper
  const handleCopy = (text: string, type: 'upi' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WEBP) for the payment proof.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8MB. Please upload a smaller screenshot.');
      return;
    }

    setErrorMessage(null);
    setScreenshotName(file.name);
    setScreenshotSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setScreenshotDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please drop a valid image file.');
      return;
    }

    setErrorMessage(null);
    setScreenshotName(file.name);
    setScreenshotSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setScreenshotDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Submit Verification Form
  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const activePlayerId = playerIdInput.trim() || currentUser?.id || '';
    if (!activePlayerId) {
      setErrorMessage('Player ID is required. Please ensure your account ID is specified.');
      return;
    }

    if (!selectedAmount || selectedAmount < 10) {
      setErrorMessage('Minimum deposit amount is ₹10.');
      return;
    }

    if (selectedAmount > 5000) {
      setErrorMessage('Maximum allowable deposit limit is ₹5,000.');
      return;
    }

    const cleanUtr = utrInput.trim();
    if (!cleanUtr) {
      setErrorMessage('Please enter the 12-digit UPI Reference Number / Transaction ID.');
      return;
    }

    if (cleanUtr.length < 6) {
      setErrorMessage('Transaction Reference / UTR must be at least 6 alphanumeric characters.');
      return;
    }

    if (!screenshotDataUrl) {
      setErrorMessage('Please upload a screenshot of your successful UPI payment proof.');
      return;
    }

    // Check for duplicate UTR
    const isDuplicate = depositRequests.some(
      r => r.utr.toLowerCase() === cleanUtr.toLowerCase() && r.status !== 'REJECTED'
    );
    if (isDuplicate) {
      setErrorMessage(`UTR ${cleanUtr} has already been submitted and is currently in review or approved.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const createdRequest = submitDepositRequest({
        amount: selectedAmount,
        utr: cleanUtr,
        screenshotUrl: screenshotDataUrl,
        playerId: activePlayerId,
        paymentMethod: selectedMethod,
        screenshotName,
        screenshotSize,
      });

      setSuccessReceipt(createdRequest);

      // Reset form fields
      setUtrInput('');
      setScreenshotDataUrl('');
      setScreenshotName('');
      setScreenshotSize('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting your deposit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter user's deposit requests
  const userRequests = depositRequests.filter(
    r =>
      r.userId === currentUser?.id ||
      r.playerId === currentUser?.id ||
      r.playerId === currentUser?.gameAccountId
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#121622] via-[#161d2d] to-[#0f1420] border-2 border-[#d4af37]/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          {onBackToGames && (
            <button
              onClick={onBackToGames}
              className="p-2.5 rounded-xl bg-[#080a10] border border-[#242c3d] text-gray-400 hover:text-[#f5d061] hover:border-[#d4af37]/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Return to Games"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                3 Verified Methods
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-[#f5d061] border border-amber-500/30">
                0% Processing Fee
              </span>
            </div>
            <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <span>BITORA VIP MANUAL DEPOSIT CASHIER</span>
              <Sparkles className="w-4 h-4 text-[#ffd700]" />
            </h1>
            <p className="text-xs text-gray-400">
              Select your preferred app (Google Pay, PhonePe, or Paytm) &bull; Scan its unique static QR &bull; Submit UTR for manual audit
            </p>
          </div>
        </div>

        {/* User Account / Balance Badge */}
        <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
          {currentUser && (
            <div className="px-3.5 py-2 rounded-2xl bg-[#0b0e14] border border-[#242c3d] text-left">
              <span className="text-[10px] text-gray-400 block font-medium">Your Unique Player ID</span>
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {currentUser.id}
              </span>
            </div>
          )}

          <div className="px-4 py-2 rounded-2xl bg-[#080a10] border border-[#d4af37]/40 text-right">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Wallet Balance
            </span>
            <div className="flex items-center gap-1.5 justify-end">
              <Coins className="w-4 h-4 text-[#ffd700]" />
              <span className="text-base sm:text-lg font-black text-[#f5d061] font-mono-numbers">
                ₹{(currentUser?.balance || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3 EXPLICIT PAYMENT OPTIONS: Google Pay, PhonePe, Paytm */}
      {/* ========================================================== */}
      <div className="bg-[#0e121a] border border-[#242c3d] rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#f5d061]" />
            <h2 className="font-cinzel text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              Choose Payment Method
            </h2>
          </div>
          <span className="text-[11px] text-gray-400">
            Selected: <strong className="text-white">{currentConfig.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Method 1: Google Pay */}
          <button
            type="button"
            onClick={() => {
              setSelectedMethod('gpay');
              setErrorMessage(null);
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[105px] ${
              selectedMethod === 'gpay'
                ? 'bg-gradient-to-br from-[#1a2336] via-[#121926] to-[#0c1018] border-[#4285F4] shadow-[0_0_25px_rgba(66,133,244,0.35)] scale-[1.02]'
                : 'bg-[#121622] border-[#242c3d] hover:border-gray-600 hover:bg-[#151b2a]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center font-bold text-base shadow-sm">
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335]">P</span>
                  <span className="text-[#FBBC05]">a</span>
                  <span className="text-[#34A853]">y</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Google Pay</span>
                    {selectedMethod === 'gpay' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </h3>
                  <span className="text-[10px] text-gray-400 block font-mono">GPay UPI QR</span>
                </div>
              </div>

              {selectedMethod === 'gpay' ? (
                <div className="w-6 h-6 rounded-full bg-[#4285F4] text-white flex items-center justify-center shadow">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <span className="text-[10px] font-bold text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-[#242c3d]">
                  Instant
                </span>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] border-t border-white/5">
              <span className="text-gray-400">Merchant VPA:</span>
              <span className="font-mono font-bold text-cyan-300 truncate max-w-[170px]">
                {paymentMethodConfigs.gpay.upiId}
              </span>
            </div>
          </button>

          {/* Method 2: PhonePe */}
          <button
            type="button"
            onClick={() => {
              setSelectedMethod('phonepe');
              setErrorMessage(null);
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[105px] ${
              selectedMethod === 'phonepe'
                ? 'bg-gradient-to-br from-[#28163f] via-[#1a1129] to-[#0f0a17] border-[#8a42f4] shadow-[0_0_25px_rgba(138,66,244,0.35)] scale-[1.02]'
                : 'bg-[#121622] border-[#242c3d] hover:border-gray-600 hover:bg-[#151b2a]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#5f259f] text-white font-black text-sm flex items-center justify-center shadow-sm">
                  पे
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>PhonePe</span>
                    {selectedMethod === 'phonepe' && (
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    )}
                  </h3>
                  <span className="text-[10px] text-gray-400 block font-mono">PhonePe Direct QR</span>
                </div>
              </div>

              {selectedMethod === 'phonepe' ? (
                <div className="w-6 h-6 rounded-full bg-[#8a42f4] text-white flex items-center justify-center shadow">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <span className="text-[10px] font-bold text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-[#242c3d]">
                  Fast Bank
                </span>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] border-t border-white/5">
              <span className="text-gray-400">Merchant VPA:</span>
              <span className="font-mono font-bold text-purple-300 truncate max-w-[170px]">
                {paymentMethodConfigs.phonepe.upiId}
              </span>
            </div>
          </button>

          {/* Method 3: Paytm */}
          <button
            type="button"
            onClick={() => {
              setSelectedMethod('paytm');
              setErrorMessage(null);
            }}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[105px] ${
              selectedMethod === 'paytm'
                ? 'bg-gradient-to-br from-[#0c2438] via-[#091826] to-[#060e17] border-[#00b9f1] shadow-[0_0_25px_rgba(0,185,241,0.35)] scale-[1.02]'
                : 'bg-[#121622] border-[#242c3d] hover:border-gray-600 hover:bg-[#151b2a]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#002e6e] border border-[#00b9f1]/50 text-[#00b9f1] font-black text-xs flex items-center justify-center shadow-sm">
                  Paytm
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Paytm</span>
                    {selectedMethod === 'paytm' && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </h3>
                  <span className="text-[10px] text-gray-400 block font-mono">Paytm UPI / Wallet</span>
                </div>
              </div>

              {selectedMethod === 'paytm' ? (
                <div className="w-6 h-6 rounded-full bg-[#00b9f1] text-black flex items-center justify-center shadow">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <span className="text-[10px] font-bold text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-[#242c3d]">
                  0% Charge
                </span>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] border-t border-white/5">
              <span className="text-gray-400">Merchant VPA:</span>
              <span className="font-mono font-bold text-cyan-300 truncate max-w-[170px]">
                {paymentMethodConfigs.paytm.upiId}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Amount & Method-Specific QR | Right = Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================== */}
        {/* LEFT COLUMN: Amount Selection & Selected Method's Static QR Code */}
        {/* ========================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step 1: Amount Selection */}
          <div className="bg-[#0e121a] border border-[#242c3d] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242c3d] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#d4af37] text-black font-black text-xs flex items-center justify-center font-mono">
                  1
                </span>
                <h3 className="font-cinzel text-sm sm:text-base font-bold text-white">
                  Select Deposit Amount
                </h3>
              </div>
              <span className="text-[10px] text-gray-400">Min ₹10 &bull; Max ₹5,000</span>
            </div>

            {/* Quick Amount Chips */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {DEPOSIT_PRESETS.map((p) => {
                const isSelected = selectedAmount === p.amount;
                return (
                  <button
                    key={p.amount}
                    type="button"
                    onClick={() => handleSelectPreset(p.amount)}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#d4af37]/25 to-amber-950/40 border-[#ffd700] text-[#ffd700] shadow-[0_0_15px_rgba(212,175,55,0.3)] scale-[1.02]'
                        : 'bg-[#121622] border-[#242c3d] text-gray-300 hover:border-[#d4af37]/40 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-black block font-mono-numbers">{p.label}</span>
                    <span className="text-[9px] text-gray-400 block">{p.tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Field */}
            <div className="pt-2">
              <label className="text-[11px] text-gray-400 block mb-1.5 font-medium">
                Or Enter Custom Amount (₹):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={customAmountInput}
                  onChange={handleCustomAmountChange}
                  placeholder="e.g. 500"
                  className="w-full bg-[#080a10] border border-[#242c3d] rounded-2xl pl-8 pr-16 py-2.5 text-white font-mono-numbers font-bold text-sm focus:outline-none focus:border-[#d4af37] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(selectedAmount.toString(), 'amount')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-[#141926] border border-[#242c3d] text-[10px] text-gray-300 hover:text-[#f5d061] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy Amount"
                >
                  {copiedAmount ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAmount ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Method-Specific Static QR Code Card (Strictly View-Only for Players) */}
          <div className="bg-[#0e121a] border-2 border-[#d4af37]/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_35px_rgba(212,175,55,0.15)] space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#242c3d] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#d4af37] text-black font-black text-xs flex items-center justify-center font-mono">
                  2
                </span>
                <div>
                  <h3 className="font-cinzel text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                    <span>Scan {currentConfig.name} QR Code</span>
                    <QrCode className="w-4 h-4 text-[#ffd700]" />
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-semibold">
                    Administrator-Configured Static QR
                  </p>
                </div>
              </div>

              <span
                className={`text-[9px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${
                  selectedMethod === 'gpay'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : selectedMethod === 'phonepe'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {currentConfig.badge}
              </span>
            </div>

            {/* Crucially: Pure static QR image viewer. Random players cannot modify or upload here. */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3.5 bg-white rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.3)] border-4 border-[#ffd700] relative group">
                <img
                  src={currentConfig.qrImageUrl}
                  alt={`Official Bitora ${currentConfig.name} Deposit QR Scanner`}
                  className="w-56 h-56 object-contain rounded-lg"
                />
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#080a10] border border-[#d4af37] text-[#ffd700] font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                  PAY ₹{selectedAmount.toLocaleString('en-IN')} VIA {currentConfig.name.toUpperCase()}
                </div>
              </div>

              <div className="pt-2 space-y-1 w-full">
                <div className="p-2.5 rounded-xl bg-[#080a10] border border-[#242c3d] flex items-center justify-between gap-2">
                  <div className="text-left overflow-hidden">
                    <span className="text-[9px] text-gray-500 uppercase font-bold block">
                      {currentConfig.name} UPI ID (VPA)
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300 truncate block">
                      {currentConfig.upiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentConfig.upiId, 'upi')}
                    className="px-3 py-1.5 rounded-lg bg-[#161c2b] hover:bg-[#1e2538] border border-[#d4af37]/40 text-[#f5d061] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy VPA</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between px-1 text-[11px] text-gray-400 pt-1">
                  <span>Payee Name:</span>
                  <span className="font-bold text-white">{currentConfig.payeeName}</span>
                </div>
              </div>

              {/* Specific Instructions for the selected method */}
              <div className="p-3 rounded-xl bg-[#121622] border border-[#242c3d] text-left text-xs text-gray-300 w-full space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#f5d061] block">
                  How to pay with {currentConfig.name}:
                </span>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  {currentConfig.instructions}
                </p>
              </div>

              {/* View-Only Player Guarantee Notice (for regular players) */}
              {!isAdmin && (
                <p className="text-[10px] text-gray-500 italic">
                  Static merchant QR verified by Bitora VIP administration &bull; View-only player mode
                </p>
              )}

              {/* ========================================================== */}
              {/* ADMIN-ONLY FEATURE: Update QR Code & UPI ID (Hidden from regular players) */}
              {/* ========================================================== */}
              {isAdmin && (
                <div className="w-full pt-2 border-t border-amber-500/30 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#ffd700]" />
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                        Admin Only: {currentConfig.name} QR &amp; UPI Control
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdminQrEditor(prev => !prev)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[#ffd700] text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {showAdminQrEditor ? 'Hide Editor' : 'Update QR & UPI ID'}
                    </button>
                  </div>

                  {showAdminQrEditor && (
                    <form
                      onSubmit={handleAdminSaveQrAndUpi}
                      className="p-3.5 rounded-2xl bg-[#080a10] border border-amber-500/40 space-y-3 animate-in fade-in duration-200"
                    >
                      <input
                        type="file"
                        ref={adminQrFileInputRef}
                        accept="image/*"
                        onChange={handleAdminQrFileUpload}
                        className="hidden"
                      />

                      <div>
                        <label className="text-[11px] font-bold text-gray-300 block mb-1">
                          1. Update {currentConfig.name} QR Code Image:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => adminQrFileInputRef.current?.click()}
                            className="px-3 py-2 rounded-xl bg-[#141926] hover:bg-[#1e2638] border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload QR Image</span>
                          </button>
                          <input
                            type="text"
                            value={adminQrUrlInput}
                            onChange={e => setAdminQrUrlInput(e.target.value)}
                            placeholder="Or paste QR image URL / Data URI..."
                            className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-300 block mb-1">
                          2. Update {currentConfig.name} UPI ID (VPA):
                        </label>
                        <input
                          type="text"
                          value={adminUpiIdInput}
                          onChange={e => setAdminUpiIdInput(e.target.value)}
                          placeholder="e.g. merchant@okaxis"
                          className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-[#d4af37]"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-300 block mb-1">
                          3. Update Payee / Merchant Name:
                        </label>
                        <input
                          type="text"
                          value={adminPayeeNameInput}
                          onChange={e => setAdminPayeeNameInput(e.target.value)}
                          placeholder="e.g. Bitora Official VIP"
                          className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      {adminSaveFeedback && (
                        <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{adminSaveFeedback}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] text-black font-black text-xs shadow-md hover:brightness-110 transition-all cursor-pointer"
                      >
                        Save &amp; Publish {currentConfig.name} QR + UPI ID
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* RIGHT COLUMN: Submission Form (Player ID, Amount, UTR, Screenshot) */}
        {/* ========================================================== */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0e121a] border border-[#242c3d] rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#242c3d] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#d4af37] text-black font-black text-xs flex items-center justify-center font-mono">
                  3
                </span>
                <div>
                  <h3 className="font-cinzel text-base font-bold text-white">
                    Submit {currentConfig.name} Verification Form
                  </h3>
                  <p className="text-xs text-gray-400">
                    Enter your transfer details for administrator audit &amp; manual wallet credit
                  </p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#ffd700]" />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {/* Success Receipt Banner */}
            {successReceipt && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0e1a14] to-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs space-y-2.5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Deposit Request Logged Successfully!</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 font-mono text-[10px] text-emerald-300">
                    {successReceipt.id}
                  </span>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Your deposit of <strong className="text-[#f5d061]">₹{successReceipt.amount.toLocaleString('en-IN')}</strong> via <strong className="text-white">{successReceipt.paymentMethodName || 'UPI'}</strong> with UTR <strong className="text-white font-mono">{successReceipt.utr}</strong> has been logged for supervisor audit. Your unique Player ID (<span className="text-cyan-300 font-mono">{successReceipt.playerId}</span>) will be credited immediately upon bank confirmation.
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-emerald-500/20 pt-2">
                  <span>Status: <strong className="text-amber-400">PENDING SUPERVISOR AUDIT</strong></span>
                  <span>Submitted: {successReceipt.createdAt}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitVerification} className="space-y-4">
              {/* Field 1: Unique Player ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Unique Player ID</span>
                    <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Guaranteed Unique Linkage
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={playerIdInput}
                    onChange={(e) => setPlayerIdInput(e.target.value)}
                    placeholder="e.g. BIT-782914 or BTY-GAME-782914"
                    readOnly={Boolean(currentUser)}
                    className={`w-full rounded-2xl px-3.5 py-2.5 font-mono text-sm focus:outline-none transition-colors ${
                      currentUser
                        ? 'bg-[#0b0e14] border border-cyan-500/30 text-cyan-300 cursor-default'
                        : 'bg-[#080a10] border border-[#242c3d] text-white focus:border-[#d4af37]'
                    }`}
                  />
                  {currentUser && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Connected to player account: <strong className="text-white">{currentUser?.username || 'Guest'}</strong> &bull; Administrator will verify and credit this exact Player ID.
                </p>
              </div>

              {/* Field 2: Selected Payment Method Indicator */}
              <div className="p-3 rounded-2xl bg-[#121622] border border-[#242c3d] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    Paying Via Method
                  </span>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedMethod === 'gpay'
                          ? 'bg-[#4285F4]'
                          : selectedMethod === 'phonepe'
                          ? 'bg-[#8a42f4]'
                          : 'bg-[#00b9f1]'
                      }`}
                    />
                    {currentConfig.name} ({currentConfig.badge})
                  </span>
                </div>
                <span className="text-[11px] text-[#f5d061] font-mono font-bold">
                  {currentConfig.upiId}
                </span>
              </div>

              {/* Field 3: Deposit Amount */}
              <div>
                <label className="text-xs font-bold text-white block mb-1.5">
                  Amount Transferred (INR) <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                    className="w-full bg-[#080a10] border border-[#242c3d] rounded-2xl pl-8 pr-28 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-[#d4af37]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#f5d061] bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    +{selectedAmount.toLocaleString('en-IN')} Credits
                  </span>
                </div>
              </div>

              {/* Field 4: UTR / Transaction ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>12-Digit UTR / Transaction ID</span>
                    <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {utrInput.length}/12 Digits
                  </span>
                </div>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  placeholder={`e.g. 431209876543 (from ${currentConfig.name} confirmation screen)`}
                  className="w-full bg-[#080a10] border border-[#242c3d] rounded-2xl px-3.5 py-2.5 text-white font-mono text-sm tracking-wide focus:outline-none focus:border-[#d4af37]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  The Unique Transaction Reference (UTR) is printed on your {currentConfig.name} receipt.
                </p>
              </div>

              {/* Field 5: Payment Screenshot File Upload */}
              <div>
                <label className="text-xs font-bold text-white block mb-1.5">
                  Payment Screenshot Proof <span className="text-amber-400">*</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!screenshotDataUrl ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#242c3d] hover:border-[#d4af37]/60 rounded-2xl p-5 text-center bg-[#080a10]/60 hover:bg-[#121622] transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#141926] border border-[#242c3d] flex items-center justify-center mx-auto text-[#f5d061] group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Click to upload {currentConfig.name} screenshot or drag &amp; drop
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Supports JPG, PNG, WEBP up to 8MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-[#080a10] border border-emerald-500/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        onClick={() => {
                          setModalPreviewImage(screenshotDataUrl);
                          setScreenshotPreviewOpen(true);
                        }}
                        className="w-12 h-12 rounded-xl overflow-hidden border border-[#242c3d] shrink-0 bg-black cursor-pointer hover:opacity-80 transition-opacity"
                        title="Click to view full preview"
                      >
                        <img
                          src={screenshotDataUrl}
                          alt="Screenshot Proof Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-white block truncate">
                          {screenshotName || 'payment_proof.jpg'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono block">
                          {screenshotSize || 'Attached'} &bull; Ready for submission
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setModalPreviewImage(screenshotDataUrl);
                          setScreenshotPreviewOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-[#141926] hover:bg-[#1e2538] text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title="View Full Screenshot"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotDataUrl('');
                          setScreenshotName('');
                          setScreenshotSize('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors cursor-pointer"
                        title="Remove Screenshot"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !utrInput.trim() || !screenshotDataUrl}
                  className="w-full py-4 rounded-2xl font-black text-black text-sm bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Lock className="w-4 h-4 text-black" />
                  <span>
                    {isSubmitting
                      ? 'LOGGING DEPOSIT REQUEST...'
                      : `SUBMIT ₹${selectedAmount.toLocaleString('en-IN')} VIA ${currentConfig.name.toUpperCase()} FOR AUDIT`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Security & Verification Guarantee */}
              <div className="p-3 rounded-xl bg-[#121622]/60 border border-[#242c3d] text-[11px] text-gray-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>
                  All submitted requests are audited in real time by our supervisor against official bank records. Please allow 5-15 minutes for your wallet balance to reflect the deposit.
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* Player Deposit History & Status Tracker */}
      {/* ========================================================== */}
      <div className="bg-[#0e121a] border border-[#242c3d] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#242c3d] pb-3">
          <div>
            <h3 className="font-cinzel text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ffd700]" />
              <span>Your Deposit Verification Requests</span>
            </h3>
            <p className="text-xs text-gray-400">
              Track real-time administrative approval and wallet crediting status
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#f5d061] bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
            {userRequests.length} Submissions
          </span>
        </div>

        {userRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No deposit requests submitted yet. Select an amount above to begin!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242c3d] text-gray-400 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Player ID</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">UTR / Ref No</th>
                  <th className="py-2.5 px-3">Screenshot Proof</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2535]">
                {userRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-gray-300">{req.id}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                          req.paymentMethod === 'phonepe'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : req.paymentMethod === 'paytm'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {req.paymentMethodName || (req.paymentMethod === 'phonepe' ? 'PhonePe' : req.paymentMethod === 'paytm' ? 'Paytm' : 'Google Pay')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-300 font-semibold">{req.playerId}</td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-400">
                      ₹{req.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-300">{req.utr}</td>
                    <td className="py-3 px-3">
                      {req.screenshotUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setModalPreviewImage(req.screenshotUrl);
                            setScreenshotPreviewOpen(true);
                          }}
                          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : req.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        }`}
                      >
                        {req.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                        {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {req.status === 'REJECTED' && <AlertCircle className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-400 text-[11px]">{req.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Full-Screen Screenshot Preview */}
      {screenshotPreviewOpen && modalPreviewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e121a] border border-[#d4af37]/50 rounded-3xl p-5 max-w-2xl w-full max-h-[90vh] flex flex-col space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242c3d] pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#ffd700]" />
                <h4 className="font-cinzel text-base font-bold text-white">
                  Payment Screenshot Proof
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setScreenshotPreviewOpen(false)}
                className="p-1.5 rounded-lg bg-[#141926] text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-[#242c3d] bg-black flex items-center justify-center p-2">
              <img
                src={modalPreviewImage}
                alt="Payment proof high resolution preview"
                className="max-h-[70vh] object-contain rounded"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setScreenshotPreviewOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

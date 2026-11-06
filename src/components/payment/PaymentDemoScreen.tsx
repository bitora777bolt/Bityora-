import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  QrCode,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Send,
  Sparkles,
  Info,
  Copy,
  Check,
  Camera,
  Upload,
} from 'lucide-react';

export const PaymentDemoScreen: React.FC = () => {
  const {
    currentUser,
    depositRequests,
    submitDepositRequest,
    adminProcessDepositRequest,
    ownerPaymentQr,
    updateOwnerPaymentQr,
  } = useGame();

  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const DEMO_AMOUNTS = [110, 200, 400, 800, 1000, 1600, 5000];

  // Dynamic QR code API URL (high reliability)
  const qrData = `upi://pay?pa=bitora.vip.pay@okhdfcbank&pn=BITORA_PLATFORM&am=${selectedAmount}&cu=INR&tn=VIP_DEPOSIT`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=d4af37&bgcolor=0e121a`;

  const handleGenerateUtr = () => {
    const randomUtr = `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    setReferenceNo(randomUtr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;
    if (currentUser.isSuspended) {
      setNotification('Account is suspended. Cannot submit demo requests.');
      return;
    }

    const ref = referenceNo.trim() || `UTR${Date.now().toString().slice(-8)}`;
    const newReq = submitDepositRequest(selectedAmount, ref, qrCodeUrl);

    setNotification(`Simulated deposit request (${newReq.id}) submitted! Status: PENDING.`);
    setReferenceNo('');
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText('bitora.vip.demo@okhdfcbank').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Critical Demonstration Disclaimer Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-[#1e1708] to-amber-950/60 border border-amber-500/50 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xl">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-200">
          <p className="font-bold text-amber-300 uppercase tracking-wide">
            IMPORTANT: DEMONSTRATION PURPOSE ONLY
          </p>
          <p className="text-gray-300 mt-1 leading-relaxed">
            This QR code and deposit workflow is an interactive UI simulation. <strong>Do NOT scan with real banking, UPI, or payment apps.</strong> No real money is received, charged, or paid. Virtual demo credits are granted exclusively for testing game mechanics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code & Submission Form */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#242c3d] pb-4">
              <div>
                <h2 className="font-cinzel text-lg font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#d4af37]" />
                  Simulated QR Deposit Request
                </h2>
                <p className="text-xs text-gray-400">Step 1: Choose amount &bull; Step 2: Simulate reference code</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f5d061]">
                DEMO ONLY
              </span>
            </div>

            {/* Select Demo Amount */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Select Virtual Demo Amount (Options):
              </label>
              <div className="grid grid-cols-5 gap-2">
                {DEMO_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono-numbers font-bold border transition-all cursor-pointer ${
                      selectedAmount === amt
                        ? 'bg-[#d4af37]/20 text-[#f5d061] border-[#f5d061] shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                        : 'bg-[#151b26] border-[#242c3d] text-gray-400 hover:text-white'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code / Owner Photo Container */}
            <div className="bg-[#07090e] border border-[#d4af37]/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-[#0e121a] border border-[#d4af37]/40 rounded-2xl shadow-inner">
                {ownerPaymentQr ? (
                  <img
                    src={ownerPaymentQr}
                    alt="Owner Custom Payment Scanner"
                    className="w-48 h-48 rounded-xl object-contain"
                  />
                ) : (
                  <img
                    src={qrCodeUrl}
                    alt="Simulated Deposit QR"
                    className="w-48 h-48 rounded-xl object-contain"
                  />
                )}
              </div>

              <div className="space-y-1">
                <p className="font-mono-numbers text-lg font-black text-[#f5d061]">
                  ₹{selectedAmount.toLocaleString('en-IN')} Credits
                </p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <span className="font-mono text-[11px]">UPI: bitora.vip.pay@okhdfcbank</span>
                  <button
                    onClick={handleCopyVpa}
                    className="p-1 hover:text-[#f5d061] transition-colors"
                    title="Copy Demo VPA"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Request Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Simulated UTR / Transaction Reference ID:
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateUtr}
                    className="text-[11px] text-[#f5d061] hover:underline font-medium"
                  >
                    Auto-Generate Demo UTR
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. UTR849201938472"
                  value={referenceNo}
                  onChange={e => setReferenceNo(e.target.value)}
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-4 py-2.5 text-xs font-mono-numbers text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Upload Screenshot Mock */}
              <div className="p-3 rounded-xl border border-dashed border-[#242c3d] bg-[#121622]/60 text-center text-xs text-gray-400">
                <p className="font-medium text-gray-300 mb-0.5">Mock Payment Screenshot</p>
                <p className="text-[10px] text-gray-500">
                  (Simulated file: verified by internal demo workflow)
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4 text-black" />
                <span>Submit Simulated Request</span>
              </button>
            </form>

            {notification && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{notification}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status Tracking Board & Admin Simulation Testbed */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242c3d] pb-4">
              <div>
                <h3 className="font-cinzel text-lg font-black text-white">
                  Demo Requests Tracking
                </h3>
                <p className="text-xs text-gray-400">
                  Track pending, approved, and rejected mock requests
                </p>
              </div>
              <span className="text-xs font-mono-numbers text-gray-400">
                {depositRequests.length} Total
              </span>
            </div>

            {/* Request List */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {depositRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  No demo deposit requests yet. Submit one using the form on the left!
                </div>
              ) : (
                depositRequests.map(req => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> PENDING
                    </span>
                  );
                  if (req.status === 'APPROVED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> APPROVED
                      </span>
                    );
                  } else if (req.status === 'REJECTED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> REJECTED
                      </span>
                    );
                  }

                  return (
                    <div
                      key={req.id}
                      className="bg-[#121622] border border-[#242c3d] rounded-xl p-3.5 space-y-2 hover:border-[#d4af37]/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-numbers text-xs font-bold text-white">
                            {req.id}
                          </span>
                          <span className="text-[11px] text-gray-400">&bull; {req.username}</span>
                        </div>
                        {statusBadge}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Simulated Amount:</span>
                        <span className="font-mono-numbers font-black text-[#f5d061]">
                          ₹{req.amount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono-numbers">
                        <span>Ref: {req.referenceNo}</span>
                        <span>{req.createdAt}</span>
                      </div>

                      {/* If rejected, show reason */}
                      {req.rejectionReason && (
                        <p className="text-[11px] text-red-400 bg-red-950/40 p-1.5 rounded border border-red-900/50">
                          Note: {req.rejectionReason}
                        </p>
                      )}

                      {/* Interactive Simulation Controls: Test Approve / Reject */}
                      {req.status === 'PENDING' && (
                        <div className="pt-2 border-t border-[#242c3d] flex items-center justify-end gap-2">
                          <span className="text-[10px] text-gray-500 mr-auto">
                            Simulate Admin Action:
                          </span>
                          <button
                            onClick={() => adminProcessDepositRequest(req.id, 'APPROVE')}
                            className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 cursor-pointer"
                          >
                            Approve Demo
                          </button>
                          <button
                            onClick={() =>
                              adminProcessDepositRequest(req.id, 'REJECT', 'Simulated mismatch in demo ref')
                            }
                            className="px-2.5 py-1 rounded bg-red-600/30 hover:bg-red-600/50 text-red-300 text-[11px] font-bold border border-red-500/40 cursor-pointer"
                          >
                            Reject Demo
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

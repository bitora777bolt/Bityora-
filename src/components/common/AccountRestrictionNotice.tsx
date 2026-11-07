import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ShieldAlert, Lock, AlertTriangle, Snowflake, UserX, Copy, Check, ExternalLink, HelpCircle } from 'lucide-react';

export const AccountRestrictionNotice: React.FC = () => {
  const { currentUser } = useGame();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedGameId, setCopiedGameId] = useState(false);
  const [appealSent, setAppealSent] = useState(false);

  if (!currentUser || currentUser.accountStatus === 'ACTIVE') {
    return null;
  }

  const handleCopyId = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyGameId = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.gameAccountId);
    setCopiedGameId(true);
    setTimeout(() => setCopiedGameId(false), 2000);
  };

  const isBlocked = currentUser.accountStatus === 'BLOCKED';
  const isFrozen = currentUser.accountStatus === 'FROZEN';
  const isSuspended = currentUser.accountStatus === 'SUSPENDED';

  const title = isBlocked
    ? 'ACCOUNT PERMANENTLY BLOCKED'
    : isFrozen
    ? 'ACCOUNT ASSETS & BETTING FROZEN'
    : 'ACCOUNT TEMPORARILY SUSPENDED';

  const badgeColor = isBlocked
    ? 'bg-red-500/20 text-red-300 border-red-500/50'
    : isFrozen
    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
    : 'bg-amber-500/20 text-amber-300 border-amber-500/50';

  const icon = isBlocked ? (
    <UserX className="w-8 h-8 text-red-400" />
  ) : isFrozen ? (
    <Snowflake className="w-8 h-8 text-cyan-400" />
  ) : (
    <Lock className="w-8 h-8 text-amber-400" />
  );

  return (
    <div className="bg-[#0b0e14] border-2 border-red-500/40 rounded-2xl p-5 mb-6 shadow-2xl relative overflow-hidden animate-fadeIn">
      <div
        className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isBlocked ? 'bg-red-600/10' : isFrozen ? 'bg-cyan-600/10' : 'bg-amber-600/10'
        }`}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 border-b border-[#242c3d] pb-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${
              isBlocked
                ? 'bg-red-500/15 border-red-500/40'
                : isFrozen
                ? 'bg-cyan-500/15 border-cyan-500/40'
                : 'bg-amber-500/15 border-amber-500/40'
            }`}
          >
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeColor}`}>
                {currentUser.accountStatus}
              </span>
              <h2 className="font-cinzel text-base sm:text-lg font-black text-white">{title}</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Enforcement authority executed by Bitora Platform Administration &amp; Anti-Fraud Compliance.
            </p>
          </div>
        </div>

        {/* Verification Credentials */}
        <div className="flex items-center gap-2 bg-[#121622] border border-[#242c3d] px-3 py-2 rounded-xl text-xs">
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-semibold">Unique User ID:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono-numbers font-bold text-[#f5d061]">{currentUser.id}</span>
              <button onClick={handleCopyId} className="text-gray-400 hover:text-white" title="Copy User ID">
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-700 mx-1" />
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-semibold">Connected Game Account:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono-numbers font-bold text-cyan-300">{currentUser.gameAccountId}</span>
              <button onClick={handleCopyGameId} className="text-gray-400 hover:text-white" title="Copy Game Account ID">
                {copiedGameId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
        <div className="bg-[#121622] border border-[#242c3d] p-3.5 rounded-xl space-y-1">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Official Reason</span>
          <p className="font-semibold text-white">
            {currentUser.statusReason || 'Policy compliance verification or suspicious activity investigation.'}
          </p>
        </div>

        <div className="bg-[#121622] border border-[#242c3d] p-3.5 rounded-xl space-y-1">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Restriction Scope</span>
          <p className="text-gray-300">
            {isBlocked
              ? 'Complete revocation of all games, betting, deposits, and withdrawal capabilities.'
              : isFrozen
              ? 'Betting and fund movement temporarily locked; profile and history remain viewable.'
              : 'Temporary lockout from launching or wagering in any connected games.'}
          </p>
        </div>

        <div className="bg-[#121622] border border-[#242c3d] p-3.5 rounded-xl space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Administrative Resolution</span>
            <p className="text-gray-400 text-[11px]">
              If you believe this restriction was placed in error, contact compliance supervisor citing your User ID.
            </p>
          </div>
          {appealSent ? (
            <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 mt-1">
              <Check className="w-3.5 h-3.5" /> Appeal Ticket Submitted (#APL-{currentUser.id.slice(-4)})
            </span>
          ) : (
            <button
              onClick={() => setAppealSent(true)}
              className="mt-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-[11px] transition-colors border border-gray-700 w-fit"
            >
              Submit Compliance Appeal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

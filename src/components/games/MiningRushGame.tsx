import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/soundEffects';
import {
  Sparkles,
  Minus,
  Plus,
  Trophy,
  Pickaxe,
  Coins,
  ShieldCheck,
  Gift,
} from 'lucide-react';
import { GameScoreboard } from '../common/GameScoreboard';

export type MineOutcome = 'IDLE' | 'STONE' | 'GOLD_COIN';

interface ExcavationSite {
  id: number;
  label: string;
  revealed: boolean;
  outcome: MineOutcome;
}

export const MiningRushGame: React.FC = () => {
  const { currentUser, recordGameRound, hasClaimedFirstGameBonus } = useGame();

  // Wager: Min ₹1, Max ₹10,000 strictly enforced
  const [wager, setWager] = useState<number>(100);
  const [isExcavating, setIsExcavating] = useState<boolean>(false);
  const [lastOutcome, setLastOutcome] = useState<MineOutcome>('IDLE');
  const [lastPayout, setLastPayout] = useState<number>(0);
  const [lastProfit, setLastProfit] = useState<number>(0);
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null);

  // Balanced probability engine (internal, not exposed in UI)
  const [consecutiveStones, setConsecutiveStones] = useState<number>(0);

  // 12 Interactive Excavation Rock Sites (4x3 Grid)
  const initialSites: ExcavationSite[] = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    label: `Site ${(i + 1).toString().padStart(2, '0')}`,
    revealed: false,
    outcome: 'IDLE',
  }));

  const [sites, setSites] = useState<ExcavationSite[]>(initialSites);
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, []);

  const handleWagerChange = (val: number) => {
    sounds.chipClick();
    const clamped = Math.min(10000, Math.max(1, Math.floor(val)));
    setWager(clamped);
  };

  const handleDoubleWager = () => {
    sounds.chipClick();
    const maxAfford = currentUser?.balance ? Math.min(10000, currentUser.balance) : 10000;
    setWager(prev => Math.min(maxAfford, prev * 2));
  };

  const handleHalfWager = () => {
    sounds.chipClick();
    setWager(prev => Math.max(1, Math.floor(prev / 2)));
  };

  const handleMaxWager = () => {
    sounds.chipClick();
    const maxAfford = currentUser?.balance ? Math.min(10000, currentUser.balance) : 10000;
    setWager(maxAfford);
  };

  // Perform Excavation on a chosen rock box (1 of 12)
  const executeMiningDig = (siteId?: number) => {
    if (isExcavating) return;

    if (!currentUser || currentUser.balance < wager) {
      alert(`Insufficient balance. Your current balance is ₹${currentUser?.balance?.toFixed(2) || '0.00'}.`);
      return;
    }

    // Pick target site: chosen site or first unrevealed site or random
    const targetId = siteId || Math.floor(Math.random() * 12) + 1;

    sounds.chipClick();
    setIsExcavating(true);
    setActiveSiteId(targetId);
    setLastOutcome('IDLE');

    // Reset sites, marking target as active
    setSites(prev =>
      prev.map(s => ({
        ...s,
        revealed: s.id === targetId,
        outcome: 'IDLE',
      }))
    );

    // Balanced medium-hard excavation execution:
    animTimeoutRef.current = setTimeout(() => {
      const isFirstVisitBonus = !hasClaimedFirstGameBonus;
      let isGoldCoin = false;

      if (isFirstVisitBonus) {
        isGoldCoin = true;
      } else if (consecutiveStones >= 3) {
        isGoldCoin = Math.random() < 0.85;
      } else if (consecutiveStones === 2) {
        isGoldCoin = Math.random() < 0.60;
      } else {
        isGoldCoin = Math.random() < 0.32;
      }

      const outcomeResult: MineOutcome = isGoldCoin ? 'GOLD_COIN' : 'STONE';
      setLastOutcome(outcomeResult);

      // Update the 12-tile grid
      setSites(prev =>
        prev.map(s => (s.id === targetId ? { ...s, revealed: true, outcome: outcomeResult } : s))
      );

      if (outcomeResult === 'STONE') {
        // Stone: 0 payout, total loss of wager
        sounds.mineExplode();
        setLastPayout(0);
        setLastProfit(-wager);
        setConsecutiveStones(prev => prev + 1);

        recordGameRound(
          'MINING_RUSH',
          'Mining Rush',
          wager,
          0,
          0,
          `Stone Excavated (Site #${targetId}) - Loss: -₹${wager}`
        );
      } else {
        // Gold Coin: +10% Net Profit on top of wager
        // e.g. ₹100 wager -> +₹10 profit = ₹110 payout
        // e.g. ₹1 wager -> +₹0.10 profit = ₹1.10 payout
        sounds.cashOutWin();
        const calculatedProfit = Number((wager * 0.10).toFixed(2));
        const calculatedPayout = Number((wager + calculatedProfit).toFixed(2));
        const mult = 1.10;

        setLastProfit(calculatedProfit);
        setLastPayout(calculatedPayout);
        setConsecutiveStones(0);

        recordGameRound(
          'MINING_RUSH',
          'Mining Rush',
          wager,
          mult,
          calculatedPayout,
          `Gold Coin Struck (Site #${targetId}) - Won ₹${calculatedPayout} (+₹${calculatedProfit} Profit @ 1.10x)`
        );
      }

      setIsExcavating(false);
      setActiveSiteId(null);
    }, 650);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* 1. Opulent Hero Banner with Original Dwarf Miner & Official Assets */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/60 bg-gradient-to-b from-[#241309] via-[#140b05] to-[#0a0503] shadow-[0_0_50px_rgba(245,158,11,0.3)] p-5 sm:p-7">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 justify-between">
          {/* Left Text */}
          <div className="space-y-3.5 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>12 EXCAVATION SITES &bull; ₹1 - ₹10,000 WAGERS</span>
            </div>

            <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-white leading-tight tracking-wide">
              MINING <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(245,158,11,0.5)]">RUSH</span>
            </h1>

            <p className="text-sm text-gray-300 leading-relaxed">
              Excavate any of the 12 subterranean rock sites! If a <strong>Stone</strong> is unearthed, the investment becomes <strong>Zero</strong>. If the <strong>Gold Coin</strong> appears, you win an instant <strong>+10% net profit</strong> on top of your wager (₹100 bet earns +₹10 profit = ₹110 total payout; ₹1 bet earns +₹0.10 profit = ₹1.10 total payout)!
            </p>

            {/* Clean Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1 text-xs font-mono-numbers">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-slate-600 text-gray-300">
                <img src="/assets/aistudio/f89ba92607aaf1285f96daea687e5338_ede2d1e3.jpg" alt="Stone" className="w-4 h-4 rounded-full object-contain" />
                <span>Stone = 0 (Total Loss)</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/50 text-yellow-300">
                <img src="/assets/aistudio/a5ba76a9090a2b21a96c7350b70bca5d_9f35f8eb.jpg" alt="Gold Coin" className="w-4 h-4 rounded-full object-contain" />
                <span>Gold Coin = +10% Profit</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wagers: ₹1 to ₹10,000</span>
              </span>
            </div>
          </div>

          {/* Right Dwarf Miner Graphic */}
          <div className="relative group flex-shrink-0">
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-3xl overflow-hidden border-2 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.45)] bg-gradient-to-b from-[#1b0d05] via-[#100703] to-[#070301] flex items-center justify-center p-2.5">
              <img
                src="/assets/aistudio/IMG_20261030_232331_48e707aa.jpg"
                alt="Mining Rush Dwarf Miner"
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.7)] group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />

              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-200 text-black font-black text-[11px] shadow-lg flex items-center gap-1.5">
                <Pickaxe className="w-3.5 h-3.5" />
                <span>12 SITES</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Welcome First Visit Bonus Notification (if applicable) */}
      {!hasClaimedFirstGameBonus && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-950/70 via-yellow-900/40 to-neutral-950 border-2 border-amber-400/70 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-cinzel text-sm sm:text-base font-black text-amber-200">
                FIRST-VISIT REWARD: +₹100 GUARANTEED PROFIT!
              </p>
              <p className="text-xs text-gray-300 font-mono-numbers">
                Your first game round unlocks a guaranteed Gold Coin victory with +₹100 net profit credited directly!
              </p>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider flex-shrink-0">
            FIRST PLAY GUARANTEE
          </div>
        </div>
      )}

      {/* 3. Main Excavation Arena & Betting Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Console: Betting Controls & Instant Mine Action (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-5 rounded-3xl bg-gradient-to-b from-[#131924] via-[#0e131d] to-[#090d14] border border-[#243147] p-5 sm:p-6 shadow-xl">
          {/* Unified Balance Display */}
          <div className="rounded-2xl bg-[#090d14] border border-[#1f2b3e] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-mono-numbers text-gray-400">UNIFIED BALANCE</p>
                <p className="text-lg font-mono-numbers font-black text-white">
                  ₹{currentUser?.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              Active
            </div>
          </div>

          {/* Wager Configuration (₹1 - ₹10,000 strictly enforced) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
                <span>Wager Amount (₹1 - ₹10,000)</span>
              </label>
              <span className="text-[11px] font-mono-numbers text-amber-400">
                Current: ₹{wager}
              </span>
            </div>

            {/* Direct Input & Stepper */}
            <div className="flex items-center gap-2">
              <button
                disabled={isExcavating || wager <= 1}
                onClick={() => handleWagerChange(wager - 10)}
                className="w-11 h-11 rounded-xl bg-[#1b2333] hover:bg-[#253147] disabled:opacity-40 border border-[#2a3850] flex items-center justify-center text-white font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  disabled={isExcavating}
                  value={wager}
                  onChange={e => handleWagerChange(Number(e.target.value))}
                  className="w-full h-11 rounded-xl bg-[#090d14] border border-[#2a3850] focus:border-amber-400 pl-8 pr-3 text-white font-mono-numbers font-bold text-base focus:outline-none transition-all"
                />
              </div>

              <button
                disabled={isExcavating || wager >= 10000}
                onClick={() => handleWagerChange(wager + 10)}
                className="w-11 h-11 rounded-xl bg-[#1b2333] hover:bg-[#253147] disabled:opacity-40 border border-[#2a3850] flex items-center justify-center text-white font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Chips (Half, Double, Min, Max) */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                disabled={isExcavating}
                onClick={handleHalfWager}
                className="py-1.5 rounded-lg bg-[#182130] hover:bg-[#233148] disabled:opacity-40 border border-[#293954] text-[11px] font-bold text-gray-300 transition-colors"
              >
                1/2
              </button>
              <button
                disabled={isExcavating}
                onClick={handleDoubleWager}
                className="py-1.5 rounded-lg bg-[#182130] hover:bg-[#233148] disabled:opacity-40 border border-[#293954] text-[11px] font-bold text-gray-300 transition-colors"
              >
                2X
              </button>
              <button
                disabled={isExcavating}
                onClick={() => handleWagerChange(1)}
                className="py-1.5 rounded-lg bg-[#182130] hover:bg-[#233148] disabled:opacity-40 border border-[#293954] text-[11px] font-bold text-amber-300 transition-colors"
              >
                MIN (₹1)
              </button>
              <button
                disabled={isExcavating}
                onClick={handleMaxWager}
                className="py-1.5 rounded-lg bg-[#182130] hover:bg-[#233148] disabled:opacity-40 border border-[#293954] text-[11px] font-bold text-amber-400 transition-colors"
              >
                MAX (₹10K)
              </button>
            </div>

            {/* Standard Preset Amounts */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[1, 10, 50, 100, 500, 1000, 5000, 10000].map(amt => (
                <button
                  key={amt}
                  disabled={isExcavating}
                  onClick={() => handleWagerChange(amt)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    wager === amt
                      ? 'bg-amber-500 text-black border border-amber-300 shadow-md font-black'
                      : 'bg-[#121824] hover:bg-[#1a2333] border border-[#222e42] text-gray-300'
                  }`}
                >
                  ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Instant Mining Button */}
          <div className="pt-2">
            <button
              disabled={isExcavating}
              onClick={() => executeMiningDig()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-60 text-black font-black text-lg tracking-wider uppercase shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Pickaxe className={`w-5 h-5 ${isExcavating ? 'animate-spin' : ''}`} />
              <span>{isExcavating ? 'EXCAVATING...' : `MINE NOW (₹${wager})`}</span>
            </button>
          </div>

          {/* Profit Calculation Reference */}
          <div className="rounded-2xl bg-[#090d14] border border-[#1f2b3e] p-4 space-y-2 text-xs font-mono-numbers">
            <div className="flex justify-between text-gray-400">
              <span>Your Wager:</span>
              <span className="text-white font-bold">₹{wager.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>🪨 Stone Result:</span>
              <span className="text-red-400 font-bold">₹0.00 (Loss: -₹{wager})</span>
            </div>
            <div className="flex justify-between text-gray-400 pt-1 border-t border-[#1b2536]">
              <span>🏆 Gold Coin Result (+10%):</span>
              <span className="text-emerald-400 font-black text-sm">
                ₹{(wager * 1.10).toFixed(2)} (+₹{(wager * 0.10).toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        {/* Right Area: 12 Interactive Subterranean Rock Excavation Boxes (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="relative rounded-3xl overflow-hidden border border-[#2b3a52] bg-gradient-to-b from-[#101620] via-[#0b0e15] to-[#06080d] p-4 sm:p-6 shadow-2xl min-h-[460px] flex flex-col justify-between">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />

            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#1f2b3e]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Pickaxe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-cinzel text-sm sm:text-base font-bold text-white tracking-wider">
                    12 EXCAVATION SITES
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono-numbers">
                    Click any rock box below to excavate
                  </p>
                </div>
              </div>

              {lastOutcome === 'GOLD_COIN' && (
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/50 text-yellow-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  <span>+10% GOLD PROFIT CASHED OUT!</span>
                </div>
              )}
            </div>

            {/* Central Excavation Chamber: 12 Distinct Rock Boxes (4 Columns x 3 Rows) */}
            <div className="relative z-10 py-3 my-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {sites.map(site => {
                  const isSelected = activeSiteId === site.id;
                  return (
                    <button
                      key={site.id}
                      disabled={isExcavating}
                      onClick={() => executeMiningDig(site.id)}
                      className={`relative group rounded-2xl border p-2 sm:p-3 text-center transition-all duration-300 active:scale-95 cursor-pointer flex flex-col items-center justify-between min-h-[125px] sm:min-h-[140px] overflow-hidden ${
                        isSelected
                          ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse'
                          : site.revealed && site.outcome === 'STONE'
                          ? 'bg-gradient-to-b from-[#1b1c20] to-[#101115] border-slate-700 shadow-md'
                          : site.revealed && site.outcome === 'GOLD_COIN'
                          ? 'bg-gradient-to-b from-amber-950/60 via-yellow-950/40 to-neutral-950 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)]'
                          : 'bg-gradient-to-b from-[#182333] via-[#111926] to-[#0c121d] hover:from-[#212f45] hover:to-[#141e2e] border-[#293a52] hover:border-amber-400/70 shadow-md'
                      }`}
                    >
                      {/* Top Label */}
                      <div className="text-[9px] sm:text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                        {site.label}
                      </div>

                      {/* Center Content: Unrevealed Rock, Or Revealed Stone / Gold Coin */}
                      <div className="my-1.5 flex items-center justify-center w-full">
                        {isExcavating && isSelected ? (
                          <div className="flex flex-col items-center gap-1">
                            <Pickaxe className="w-8 h-8 text-yellow-300 animate-spin" />
                            <span className="text-[9px] font-bold text-amber-300">Drilling...</span>
                          </div>
                        ) : !site.revealed ? (
                          /* Unrevealed 3D Rock Site */
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#090e17] border border-[#2b3c54] flex flex-col items-center justify-center p-1 group-hover:scale-105 group-hover:border-amber-400 transition-all shadow-inner">
                            <Pickaxe className="w-6 h-6 text-amber-300/80 group-hover:text-yellow-300" />
                          </div>
                        ) : site.outcome === 'STONE' ? (
                          /* Authentic Stone Asset */
                          <div className="flex flex-col items-center animate-in zoom-in-75 duration-300">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-black/60 border-2 border-slate-700 p-0.5 flex items-center justify-center shadow-lg">
                              <img
                                src="/assets/aistudio/f89ba92607aaf1285f96daea687e5338_ede2d1e3.jpg"
                                alt="Stone"
                                className="w-full h-full object-contain filter drop-shadow"
                              />
                            </div>
                            <span className="text-[10px] sm:text-xs font-black text-gray-300 mt-1">
                              Stone (0)
                            </span>
                          </div>
                        ) : (
                          /* Authentic Gold Coin Asset */
                          <div className="flex flex-col items-center animate-in zoom-in-75 duration-300">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-amber-950/50 border-2 border-amber-400 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.8)]">
                              <img
                                src="/assets/aistudio/a5ba76a9090a2b21a96c7350b70bca5d_9f35f8eb.jpg"
                                alt="Gold Coin"
                                className="w-full h-full object-contain filter drop-shadow animate-pulse"
                              />
                            </div>
                            <span className="text-[10px] sm:text-xs font-black text-yellow-300 mt-1">
                              Gold (+10%)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Result Status */}
                      <div className="text-[9px] sm:text-[10px] font-bold">
                        {!site.revealed ? (
                          <span className="text-gray-400 group-hover:text-amber-300">EXCAVATE ⛏️</span>
                        ) : site.outcome === 'STONE' ? (
                          <span className="text-red-400 font-black">Zero</span>
                        ) : (
                          <span className="text-emerald-400 font-black">+₹{(wager * 0.1).toFixed(2)}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Center Outcome Banners */}
              {lastOutcome === 'STONE' && (
                <div className="mt-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-neutral-900 to-neutral-950 border-2 border-red-500/60 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black/60 border border-slate-600 p-1 flex-shrink-0 flex items-center justify-center">
                      <img
                        src="/assets/aistudio/f89ba92607aaf1285f96daea687e5338_ede2d1e3.jpg"
                        alt="Stone Hit"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-cinzel text-sm sm:text-base font-black text-red-300">
                        STONE UNEARTHED! TOTAL LOSS
                      </h4>
                      <p className="text-xs text-gray-300 font-mono-numbers">
                        A rough stone was excavated. Payout: <strong>₹0.00</strong> (Loss: <strong>-₹{wager}</strong>). Place a new bet to drill again!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => executeMiningDig()}
                    className="py-2 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                  >
                    Place New Bet
                  </button>
                </div>
              )}

              {lastOutcome === 'GOLD_COIN' && (
                <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-yellow-950/50 to-neutral-950 border-2 border-yellow-400/80 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_35px_rgba(245,158,11,0.4)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-amber-500/20 border-2 border-yellow-300 p-1 flex-shrink-0 flex items-center justify-center">
                      <img
                        src="/assets/aistudio/a5ba76a9090a2b21a96c7350b70bca5d_9f35f8eb.jpg"
                        alt="Gold Coin Won"
                        className="w-full h-full object-contain animate-bounce"
                      />
                    </div>
                    <div>
                      <h4 className="font-cinzel text-sm sm:text-base font-black text-yellow-300">
                        🎉 GOLD COIN DISCOVERED! +10% NET PROFIT WON!
                      </h4>
                      <p className="text-xs text-gray-200 font-mono-numbers">
                        Wager: <strong>₹{wager}</strong> &bull; Net Profit: <strong className="text-emerald-300">+₹{lastProfit.toFixed(2)}</strong> &bull; Total Payout: <strong className="text-yellow-300">₹{lastPayout.toFixed(2)}</strong> credited!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => executeMiningDig()}
                    className="py-2 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                  >
                    Next Round
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Rules Footnote */}
            <div className="relative z-10 pt-3 border-t border-[#1f2b3e] flex flex-wrap items-center justify-between gap-3 text-xs font-mono-numbers">
              <div className="flex items-center gap-2 text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Provably Fair RNG &bull; Gold Coin = +10% Net Profit &bull; Stone = 0 Return</span>
              </div>
              <div className="text-gray-400">
                e.g. ₹100 wager → ₹110 payout &bull; ₹1 wager → ₹1.10 payout
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Leaderboard & Recent Winners Scoreboard */}
      <div className="pt-4">
        <GameScoreboard gameType="MINING_RUSH" gameTitle="Mining Rush" />
      </div>
    </div>
  );
};

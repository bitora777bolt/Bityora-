import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/soundEffects';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  History,
  Play,
  Minus,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Flame,
  Crown,
  BarChart3,
  CheckCircle2,
  XCircle,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { GameScoreboard } from '../common/GameScoreboard';

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

type TradeMode = 'SCALP' | 'BINARY_15S';
type PositionDirection = 'BUY' | 'SELL';

export const TradingGame: React.FC = () => {
  const { currentUser, recordGameRound } = useGame();

  const [wager, setWager] = useState<number>(100);
  const [tradeMode, setTradeMode] = useState<TradeMode>('SCALP');

  // Market & Trading State
  const [currentPrice, setCurrentPrice] = useState<number>(5845000);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(+2.45);
  const [candles, setCandles] = useState<Candle[]>([]);

  // Active Trade State
  const [activePosition, setActivePosition] = useState<{
    direction: PositionDirection;
    entryPrice: number;
    wager: number;
    startTime: number;
    currentMultiplier: number;
    targetTime?: number; // for binary 15s
  } | null>(null);

  const [binaryTimeLeft, setBinaryTimeLeft] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Select trade direction: BUY (Long ▲) or SELL (Short ▼).');
  const [history, setHistory] = useState<number[]>([2.45, 1.95, 3.80, 1.85, 2.10, 4.20, 1.95, 2.70]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activePositionRef = useRef(activePosition);
  activePositionRef.current = activePosition;

  // Potential Cashout / P&L
  const liveMultiplier = activePosition ? activePosition.currentMultiplier : 1.0;
  const liveProfit = activePosition ? Number((activePosition.wager * liveMultiplier).toFixed(2)) : 0;

  // Initialize Candle History (past 40 candles)
  useEffect(() => {
    const initialCandles: Candle[] = [];
    let basePrice = 5820000;
    const now = Date.now();

    for (let i = 39; i >= 0; i--) {
      const open = basePrice;
      const delta = (Math.random() - 0.48) * 12000;
      const close = Math.round(open + delta);
      const high = Math.round(Math.max(open, close) + Math.random() * 6000);
      const low = Math.round(Math.min(open, close) - Math.random() * 6000);
      const volume = Math.round(15 + Math.random() * 80);

      initialCandles.push({
        open,
        close,
        high,
        low,
        volume,
        timestamp: now - i * 3000,
      });
      basePrice = close;
    }
    setCandles(initialCandles);
    setCurrentPrice(basePrice);
  }, []);

  // Live Real-Time Market Price Engine & Ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };
        const now = Date.now();

        // Tick price delta with market momentum
        const tickDelta = (Math.random() - 0.49) * 4500;
        const newClose = Math.round(last.close + tickDelta);
        const newHigh = Math.max(last.high, newClose);
        const newLow = Math.min(last.low, newClose);
        last.close = newClose;
        last.high = newHigh;
        last.low = newLow;
        last.volume += Math.round(Math.random() * 5);

        setCurrentPrice(newClose);

        // If candle age > 3 seconds, close this candle and spawn a new one
        if (now - last.timestamp > 3000) {
          const nextCandle: Candle = {
            open: newClose,
            close: newClose,
            high: newClose,
            low: newClose,
            volume: Math.round(10 + Math.random() * 20),
            timestamp: now,
          };
          return [...prev.slice(1), last, nextCandle];
        }

        return [...prev.slice(0, prev.length - 1), last];
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Live Position Evaluator & Multiplier Tracker
  useEffect(() => {
    if (!activePosition) return;

    const timer = setInterval(() => {
      const pos = activePositionRef.current;
      if (!pos) return;

      const priceDiff = currentPrice - pos.entryPrice;
      const relativeMove = priceDiff / pos.entryPrice;

      if (tradeMode === 'SCALP') {
        // Leveraged Scalp mode: 1% move = 30x leverage multiplier!
        let mult = 1.0;
        if (pos.direction === 'BUY') {
          mult = 1.0 + relativeMove * 35;
        } else {
          mult = 1.0 - relativeMove * 35;
        }

        // Clamp & check liquidation / max win
        if (mult <= 0.05) {
          // Liquidated / Stop-Out
          sounds.mineExplode();
          setStatusMessage(`💥 POSITION STOPPED OUT! Price moved against your ${pos.direction} trade.`);
          recordGameRound(
            'CRYPTO_TRADING',
            'Crypto Trading Pro',
            pos.wager,
            0,
            0,
            `Liquidated on ${pos.direction} trade @ ₹${currentPrice.toLocaleString('en-IN')}`
          );
          setActivePosition(null);
          return;
        }

        // Update live multiplier
        setActivePosition(prev => (prev ? { ...prev, currentMultiplier: Math.max(0.1, Number(mult.toFixed(2))) } : null));
      } else if (tradeMode === 'BINARY_15S') {
        // 15-second binary countdown
        const elapsed = (Date.now() - pos.startTime) / 1000;
        const remaining = Math.max(0, 15 - Math.floor(elapsed));
        setBinaryTimeLeft(remaining);

        if (remaining <= 0) {
          // Binary Candle Expired!
          const won =
            (pos.direction === 'BUY' && currentPrice > pos.entryPrice) ||
            (pos.direction === 'SELL' && currentPrice < pos.entryPrice);

          if (won) {
            const winPayout = Number((pos.wager * 1.95).toFixed(2));
            sounds.cashOutWin();
            setStatusMessage(`🎯 BINARY PREDICTION WON! +₹${winPayout.toLocaleString('en-IN')} (1.95x payout)!`);
            setHistory(prev => [1.95, ...prev.slice(0, 14)]);
            recordGameRound(
              'CRYPTO_TRADING',
              'Crypto Trading Pro',
              pos.wager,
              1.95,
              winPayout,
              `Won 15s Binary ${pos.direction} (Entry: ₹${pos.entryPrice}, Exit: ₹${currentPrice})`
            );
          } else {
            sounds.mineExplode();
            setStatusMessage(`❌ BINARY PREDICTION EXPIRED OUT OF MONEY! Lost ₹${pos.wager}.`);
            recordGameRound(
              'CRYPTO_TRADING',
              'Crypto Trading Pro',
              pos.wager,
              0,
              0,
              `Lost 15s Binary ${pos.direction} (Entry: ₹${pos.entryPrice}, Exit: ₹${currentPrice})`
            );
          }
          setActivePosition(null);
        }
      }
    }, 200);

    return () => clearInterval(timer);
  }, [activePosition, currentPrice, tradeMode]);

  // Canvas Candlestick & Technical Chart Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = 360);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 360;
      }
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Dark Trading Terminal Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#05070b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Technical Chart Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const numGridY = 6;
      for (let i = 0; i <= numGridY; i++) {
        const y = (height / numGridY) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Calculate Min & Max Price across visible candles
      const visibleCandles = candles.slice(-32);
      if (visibleCandles.length === 0) return;

      let minP = Infinity;
      let maxP = -Infinity;
      visibleCandles.forEach(c => {
        if (c.low < minP) minP = c.low;
        if (c.high > maxP) maxP = c.high;
      });

      // Add 10% breathing room
      const pad = (maxP - minP) * 0.15 || 5000;
      minP -= pad;
      maxP += pad;
      const priceRange = maxP - minP || 1;

      const chartTop = 25;
      const chartBottom = height - 40;
      const chartHeight = chartBottom - chartTop;

      const priceToY = (price: number) => {
        return chartBottom - ((price - minP) / priceRange) * chartHeight;
      };

      // Draw Price Axis Values on the right
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const p = minP + (priceRange / 5) * i;
        const y = priceToY(p);
        ctx.fillText(`₹${Math.round(p).toLocaleString('en-IN')}`, width - 8, y + 3);
      }

      // 3. Render Volume Histogram Bars (bottom)
      const candleWidth = (width - 70) / visibleCandles.length;
      visibleCandles.forEach((c, idx) => {
        const x = idx * candleWidth + candleWidth * 0.5;
        const isBull = c.close >= c.open;
        const volHeight = Math.min(30, (c.volume / 100) * 28);
        ctx.fillStyle = isBull ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)';
        ctx.fillRect(x - candleWidth * 0.35, height - 35 - volHeight, candleWidth * 0.7, volHeight);
      });

      // 4. Render Japanese Candlesticks
      visibleCandles.forEach((c, idx) => {
        const x = idx * candleWidth + candleWidth * 0.5;
        const isBull = c.close >= c.open;
        const color = isBull ? '#22c55e' : '#ef4444';

        const openY = priceToY(c.open);
        const closeY = priceToY(c.close);
        const highY = priceToY(c.high);
        const lowY = priceToY(c.low);

        // Candle Wick (Vertical high-low line)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Candle Real Body
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(2, Math.abs(closeY - openY));
        const bodyWidth = Math.max(4, candleWidth * 0.68);

        ctx.fillStyle = color;
        ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
      });

      // 5. Exponential Moving Average (EMA) Cyan Trendline
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      visibleCandles.forEach((c, idx) => {
        const x = idx * candleWidth + candleWidth * 0.5;
        const y = priceToY((c.open + c.close + c.high + c.low) / 4);
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // 6. Current Price Real-Time Indicator & Dashed Crosshair
      const currentY = priceToY(currentPrice);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(width, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current Price Pulse Ticker Label
      ctx.fillStyle = currentPrice >= visibleCandles[0].open ? '#22c55e' : '#ef4444';
      ctx.fillRect(width - 90, currentY - 11, 88, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`₹${Math.round(currentPrice).toLocaleString('en-IN')}`, width - 46, currentY + 4);

      // Pulse dot on current candle
      const lastX = (visibleCandles.length - 1) * candleWidth + candleWidth * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lastX, currentY, 4, 0, Math.PI * 2);
      ctx.fill();

      // 7. Render Active Trade Entry Line (if user is in a position)
      if (activePosition) {
        const entryY = priceToY(activePosition.entryPrice);
        const isBuy = activePosition.direction === 'BUY';
        const tradeColor = isBuy ? '#10b981' : '#f43f5e';

        ctx.strokeStyle = tradeColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(0, entryY);
        ctx.lineTo(width, entryY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Entry Flag Badge
        ctx.fillStyle = tradeColor;
        ctx.beginPath();
        ctx.roundRect(10, entryY - 12, 130, 24, 6);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          `${isBuy ? '▲ BUY' : '▼ SELL'} @ ₹${Math.round(activePosition.entryPrice).toLocaleString('en-IN')}`,
          18,
          entryY + 4
        );
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [candles, currentPrice, activePosition]);

  // Adjust wager
  const adjustWager = (delta: number) => {
    if (activePosition) return;
    setWager(prev => {
      const next = prev + delta;
      return Math.max(20, Math.min(currentUser?.balance || 5000, next));
    });
  };

  // Open Trade Position
  const handleOpenPosition = (dir: PositionDirection) => {
    if (activePosition) return;
    if (!currentUser) return;
    if (currentUser.isSuspended) {
      setStatusMessage('Account suspended by administrator. Cannot play.');
      return;
    }
    if (currentUser.balance < wager) {
      setStatusMessage(`Insufficient credits. Your balance is ₹${currentUser.balance}.`);
      return;
    }

    sounds.planeAscend();
    const newPos = {
      direction: dir,
      entryPrice: currentPrice,
      wager,
      startTime: Date.now(),
      currentMultiplier: 1.0,
      targetTime: tradeMode === 'BINARY_15S' ? Date.now() + 15000 : undefined,
    };

    setActivePosition(newPos);
    if (tradeMode === 'BINARY_15S') {
      setBinaryTimeLeft(15);
      setStatusMessage(`15s Binary ${dir} Trade opened @ ₹${currentPrice.toLocaleString('en-IN')}! Waiting for candle close...`);
    } else {
      setStatusMessage(`Scalp ${dir} Trade active @ ₹${currentPrice.toLocaleString('en-IN')}. Take Profit anytime!`);
    }
  };

  // Close Scalp Trade / Take Profit
  const handleTakeProfit = () => {
    if (!activePosition || tradeMode !== 'SCALP') return;

    const winMultiplier = activePosition.currentMultiplier;
    const payout = Number((activePosition.wager * winMultiplier).toFixed(2));

    sounds.cashOutWin();
    setStatusMessage(
      winMultiplier >= 1.0
        ? `🏆 TRADE CLOSED IN PROFIT! Won ₹${payout.toLocaleString('en-IN')} @ ${winMultiplier.toFixed(2)}x!`
        : `Trade closed @ ${winMultiplier.toFixed(2)}x. Returned ₹${payout.toLocaleString('en-IN')}.`
    );

    setHistory(prev => [winMultiplier, ...prev.slice(0, 14)]);
    recordGameRound(
      'CRYPTO_TRADING',
      'Crypto Trading Pro',
      activePosition.wager,
      winMultiplier,
      payout,
      `Closed ${activePosition.direction} trade at ${winMultiplier.toFixed(2)}x`
    );

    setActivePosition(null);
  };

  const QUICK_BETS = [20, 50, 100, 250, 500, 1000];

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & History */}
      <div className="bg-[#0e121a] border border-[#d4af37]/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 border border-emerald-400/50 flex items-center justify-center text-white shadow-lg">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                Crypto Trading Pro
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                LIVE CANDLESTICKS
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-cyan-400" />
                BTC/INR &bull; REAL-TIME
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Live Japanese Candlestick Chart &bull; Scalp Long/Short with Take Profit &bull; 15s Turbo Binary
            </p>
          </div>
        </div>

        {/* History Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full md:max-w-md py-1">
          <History className="w-3.5 h-3.5 text-gray-500 shrink-0 mr-1" />
          {history.map((h, i) => (
            <span
              key={i}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-numbers font-black shrink-0 border transition-all ${
                h >= 3.0
                  ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border-emerald-400 shadow-md'
                  : h >= 1.5
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-red-500/20 text-red-300 border-red-500/40'
              }`}
            >
              {h >= 3.0 ? `🚀 ${h.toFixed(2)}x` : `${h.toFixed(2)}x`}
            </span>
          ))}
        </div>
      </div>

      {/* 2. TOP SECTION: THE LIVE TRADING TERMINAL ARENA (FULL-WIDTH CHART) */}
      <div className="space-y-2">
        {/* Market Ticker Bar */}
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              <span>BTC/INR</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </span>
            <span className="font-mono-numbers text-base font-black text-white">
              ₹{Math.round(currentPrice).toLocaleString('en-IN')}
            </span>
            <span className="font-mono-numbers text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +{priceChangePercent}%
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {activePosition && tradeMode === 'BINARY_15S' && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/60 px-2.5 py-0.5 rounded-lg font-bold font-mono-numbers animate-pulse flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                Expiring in {binaryTimeLeft}s
              </span>
            )}
            <span className="text-gray-400">Position Status:</span>
            <span
              className={`font-mono-numbers font-bold px-2.5 py-0.5 rounded-lg border text-xs ${
                activePosition
                  ? activePosition.direction === 'BUY'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-red-950 border-red-500 text-red-300'
                  : 'bg-[#151b26] border-[#242c3d] text-gray-400'
              }`}
            >
              {activePosition ? `${activePosition.direction} (${liveMultiplier.toFixed(2)}x)` : 'IDLE (NO TRADE)'}
            </span>
          </div>
        </div>

        {/* Live Candlestick Canvas Container */}
        <div className="relative bg-[#07090e] border-2 border-[#242c3d] rounded-2xl overflow-hidden shadow-2xl">
          <canvas ref={canvasRef} className="w-full block" />

          {/* Floating P&L Pill when Trade is Active */}
          {activePosition && (
            <div className="absolute top-4 left-4 bg-[#0a0f1c]/90 border border-[#242c3d] rounded-xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  activePosition.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {activePosition.direction === 'BUY' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">
                  {tradeMode === 'SCALP' ? 'Active Scalp P&L' : '15s Binary Trade'}
                </p>
                <p className="font-mono-numbers text-base font-black text-white">
                  ₹{liveProfit.toLocaleString('en-IN')}{' '}
                  <span className={`text-xs ${liveMultiplier >= 1.0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ({liveMultiplier.toFixed(2)}x)
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. TRADING CONSOLE (DIRECTLY BELOW THE CHART) */}
      <div className="bg-[#0e121a] border-2 border-[#d4af37]/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242c3d] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
              Trading Execution &amp; Risk Console
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Available Demo Balance:</span>
            <span className="font-mono-numbers font-bold text-white bg-[#151b26] px-3 py-1 rounded-lg border border-[#242c3d]">
              ₹{currentUser?.balance || 0}
            </span>
          </div>
        </div>

        {/* TRADE MODE SELECTOR */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={activePosition !== null}
            onClick={() => setTradeMode('SCALP')}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              tradeMode === 'SCALP'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md'
                : 'bg-[#151b26] hover:bg-[#242c3d] text-gray-300 border-[#242c3d]'
            } disabled:opacity-50`}
          >
            ⚡ Live Scalp Trading (Take Profit Anytime)
          </button>

          <button
            type="button"
            disabled={activePosition !== null}
            onClick={() => setTradeMode('BINARY_15S')}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              tradeMode === 'BINARY_15S'
                ? 'bg-gradient-to-r from-amber-500 to-[#d4af37] text-black border-amber-300 shadow-md'
                : 'bg-[#151b26] hover:bg-[#242c3d] text-gray-300 border-[#242c3d]'
            } disabled:opacity-50`}
          >
            ⏱️ 15s Turbo Binary (Predict Up or Down)
          </button>
        </div>

        {/* PRIMARY ACTION BUTTONS & BET QUANTITY CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Bet Quantity Amount Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">
                Adjust Trade Order Size:
              </span>
              <span className="text-[11px] text-gray-400">
                Min: ₹20 &bull; Max: ₹5,000
              </span>
            </div>

            {/* Stepper Input with [-] and [+] Quantity Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activePosition !== null || wager <= 20}
                onClick={() => adjustWager(-10)}
                title="Decrease by ₹10"
                className="w-11 h-11 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-gray-200 font-bold text-lg disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={20}
                  max={currentUser?.balance || 5000}
                  disabled={activePosition !== null}
                  value={wager}
                  onChange={e => setWager(Math.max(20, parseInt(e.target.value, 10) || 20))}
                  className="w-full bg-[#121622] border-2 border-[#242c3d] focus:border-[#d4af37] rounded-xl pl-8 pr-4 py-2.5 text-base font-mono-numbers font-bold text-white focus:outline-none disabled:opacity-50 text-center"
                />
              </div>

              <button
                type="button"
                disabled={activePosition !== null || wager >= (currentUser?.balance || 5000)}
                onClick={() => adjustWager(10)}
                title="Increase by ₹10"
                className="w-11 h-11 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-gray-200 font-bold text-lg disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                type="button"
                disabled={activePosition !== null || wager >= (currentUser?.balance || 5000)}
                onClick={() => adjustWager(50)}
                title="Increase by ₹50"
                className="px-3 h-11 rounded-xl bg-[#151b26] hover:bg-[#242c3d] border border-[#242c3d] flex items-center justify-center text-[#d4af37] font-mono-numbers font-bold text-xs disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
              >
                +₹50
              </button>
            </div>

            {/* Quick Bet Preset Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-gray-400 mr-1">Presets:</span>
              {QUICK_BETS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  disabled={activePosition !== null || amt > (currentUser?.balance || 5000)}
                  onClick={() => setWager(amt)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono-numbers font-bold transition-all cursor-pointer ${
                    wager === amt
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black shadow-md'
                      : 'bg-[#151b26] hover:bg-[#242c3d] text-gray-300 border border-[#242c3d]'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* PRIMARY TRADE BUTTONS (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {activePosition && tradeMode === 'SCALP' ? (
              // Live Scalp Close / Take Profit Button
              <button
                onClick={handleTakeProfit}
                className="w-full py-5 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all uppercase tracking-wider text-base sm:text-lg flex flex-col items-center justify-center cursor-pointer active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-emerald-100 animate-pulse" />
                  <span>TAKE PROFIT &bull; CLOSE</span>
                </div>
                <span className="font-mono-numbers text-xl sm:text-2xl font-black text-yellow-200 mt-0.5">
                  ₹{liveProfit.toLocaleString('en-IN')} ({liveMultiplier.toFixed(2)}x)
                </span>
              </button>
            ) : activePosition && tradeMode === 'BINARY_15S' ? (
              // Binary 15s Timer Waiting Card
              <div className="w-full py-5 px-4 rounded-2xl bg-[#151b26] border-2 border-amber-400/60 shadow-lg flex flex-col items-center justify-center text-center animate-pulse">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Timer className="w-5 h-5 text-amber-400" />
                  <span>15s BINARY IN PROGRESS</span>
                </div>
                <span className="font-mono-numbers text-xl font-black text-white mt-1">
                  {binaryTimeLeft} SECONDS REMAINING
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5">
                  Predicting {activePosition.direction} from ₹{Math.round(activePosition.entryPrice).toLocaleString('en-IN')}
                </span>
              </div>
            ) : (
              // BUY & SELL DUO BUTTONS
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!currentUser || currentUser.balance < wager}
                  onClick={() => handleOpenPosition('BUY')}
                  className="py-4 rounded-2xl font-black text-white bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-1.5 text-base sm:text-lg">
                    <ArrowUpRight className="w-5 h-5" />
                    <span>BUY / LONG</span>
                  </div>
                  <span className="text-[11px] font-mono-numbers text-emerald-100 font-bold mt-0.5">
                    Order ₹{wager}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!currentUser || currentUser.balance < wager}
                  onClick={() => handleOpenPosition('SELL')}
                  className="py-4 rounded-2xl font-black text-white bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-1.5 text-base sm:text-lg">
                    <ArrowDownRight className="w-5 h-5" />
                    <span>SELL / SHORT</span>
                  </div>
                  <span className="text-[11px] font-mono-numbers text-rose-100 font-bold mt-0.5">
                    Order ₹{wager}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Live High-Roller Scoreboard */}
      <GameScoreboard gameType="CRYPTO_TRADING" gameTitle="Crypto Trading Pro" />
    </div>
  );
};

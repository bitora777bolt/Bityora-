import React, { useMemo } from 'react';

/**
 * Luxury Money & Wealth Atmosphere Component
 * Renders opulent background visuals with floating 3D golden coins with ₹ insignias,
 * gold bullion aura, currency banknote silhouettes, and ambient golden dust particles.
 */
export const LuxuryMoneyAtmosphere: React.FC = () => {
  // Pre-generate stable positions for floating gold coins & sparkle particles
  const floatingCoins = useMemo(() => {
    return [
      { id: 1, left: '6%', top: '12%', size: 48, delay: '0s', duration: '9s', rotate: '15deg' },
      { id: 2, left: '92%', top: '18%', size: 42, delay: '2s', duration: '11s', rotate: '-25deg' },
      { id: 3, left: '84%', top: '65%', size: 54, delay: '1s', duration: '10s', rotate: '35deg' },
      { id: 4, left: '4%', top: '78%', size: 40, delay: '3s', duration: '12s', rotate: '-18deg' },
      { id: 5, left: '48%', top: '88%', size: 36, delay: '2.5s', duration: '13s', rotate: '20deg' },
      { id: 6, left: '88%', top: '42%', size: 34, delay: '4s', duration: '8.5s', rotate: '10deg' },
    ];
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Deep Obsidian & Gold Vignette Backdrop */}
      <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-[#07090e] opacity-80" />

      {/* 2. Top & Bottom Luxury Gold Dust Radiance */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[350px] bg-gradient-to-b from-[#d4af37]/10 via-amber-500/5 to-transparent rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 right-1/4 w-[650px] h-[400px] bg-gradient-to-t from-[#d4af37]/10 via-yellow-600/5 to-transparent rounded-full blur-[140px]" />

      {/* 3. Floating 3D Golden Coins with ₹ Symbol */}
      {floatingCoins.map((coin) => (
        <div
          key={coin.id}
          className="absolute opacity-25 hover:opacity-40 transition-opacity animate-float"
          style={{
            left: coin.left,
            top: coin.top,
            width: `${coin.size}px`,
            height: `${coin.size}px`,
            animationDelay: coin.delay,
            animationDuration: coin.duration,
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(212,175,55,0.4)]">
            <defs>
              <linearGradient id={`goldCoinEdge_${coin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="30%" stopColor="#facc15" />
                <stop offset="70%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <radialGradient id={`goldCoinFace_${coin.id}`} cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="85%" stopColor="#a16207" />
                <stop offset="100%" stopColor="#713f12" />
              </radialGradient>
            </defs>

            {/* 3D Coin Outer Edge with Serrated Ridges */}
            <circle cx="50" cy="50" r="48" fill={`url(#goldCoinEdge_${coin.id})`} stroke="#ca8a04" strokeWidth="1" />
            <circle cx="50" cy="50" r="43" fill={`url(#goldCoinFace_${coin.id})`} stroke="#fef08a" strokeWidth="1.5" strokeDasharray="4 2" />
            <circle cx="50" cy="50" r="36" fill={`url(#goldCoinFace_${coin.id})`} stroke="#78350f" strokeWidth="1" />

            {/* Indian Rupee ₹ Insignia in 3D Specular Gold */}
            <text
              x="50"
              y="60"
              fill="#fffbeb"
              stroke="#78350f"
              strokeWidth="1.2"
              fontSize="34"
              fontWeight="900"
              fontFamily="sans-serif"
              textAnchor="middle"
            >
              ₹
            </text>

            {/* Specular Highlight Glare Arc */}
            <path d="M 22 36 A 34 34 0 0 1 78 36" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />
          </svg>
        </div>
      ))}

      {/* 4. Subtle Money Cash Stacks Watermark in Lower Corners */}
      <div className="absolute bottom-6 left-6 opacity-10 pointer-events-none hidden md:block">
        <svg width="140" height="90" viewBox="0 0 140 90" fill="none">
          {/* Stacks of Currency Notes */}
          <rect x="0" y="45" width="85" height="38" rx="4" fill="#042013" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="42" cy="64" r="10" stroke="#10b981" strokeWidth="1.2" fill="none" />
          <text x="42" y="68" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">₹500</text>

          <rect x="25" y="30" width="85" height="38" rx="4" fill="#062919" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="67" cy="49" r="10" stroke="#10b981" strokeWidth="1.2" fill="none" />
          <text x="67" y="53" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">₹500</text>

          <rect x="50" y="15" width="85" height="38" rx="4" fill="#0b3823" stroke="#34d399" strokeWidth="1.5" />
          <circle cx="92" cy="34" r="10" stroke="#34d399" strokeWidth="1.2" fill="none" />
          <text x="92" y="38" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">₹500</text>
        </svg>
      </div>

      <div className="absolute bottom-6 right-6 opacity-10 pointer-events-none hidden md:block">
        <svg width="130" height="90" viewBox="0 0 130 90" fill="none">
          {/* Stacked 24K Gold Bullion Bars */}
          <polygon points="10,65 50,65 70,80 30,80" fill="#ca8a04" stroke="#facc15" strokeWidth="1" />
          <polygon points="50,65 90,65 110,80 70,80" fill="#ca8a04" stroke="#facc15" strokeWidth="1" />
          <polygon points="30,50 70,50 90,65 50,65" fill="#eab308" stroke="#fef08a" strokeWidth="1.2" />
          <polygon points="45,35 85,35 105,50 65,50" fill="#facc15" stroke="#ffffff" strokeWidth="1.2" />
          <text x="75" y="44" fill="#78350f" fontSize="8" fontWeight="bold" textAnchor="middle">999.9 GOLD</text>
        </svg>
      </div>
    </div>
  );
};

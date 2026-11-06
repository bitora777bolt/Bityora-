import React from 'react';
import { GameKey } from '../games/GamesHub';

interface LuxuryIconProps {
  gameId: GameKey | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * High-Definition, Original 3D Expensive Luxury Casino Icons
 * Handcrafted with multi-layered radial metallic gradients, specular reflections,
 * 24K gold filigree, gemstones, and VIP casino depth.
 */
export const LuxuryGameIcon: React.FC<LuxuryIconProps> = ({
  gameId,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-16 h-14',
    md: 'w-28 h-22 sm:w-32 sm:h-24',
    lg: 'w-36 h-28 sm:w-44 sm:h-32',
    xl: 'w-48 h-36',
  }[size];

  switch (gameId) {
    case 'mining_rush':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Ambient gold and crystal blue shaft glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/40 via-yellow-500/25 to-sky-500/20 rounded-2xl blur-xl pointer-events-none" />
          
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-[0_8px_25px_rgba(245,158,11,0.55)] group-hover:border-[#fde047] group-hover:shadow-[0_0_30px_rgba(250,204,21,0.7)] transition-all bg-gradient-to-b from-[#241309] via-[#150b05] to-[#090503] flex items-center justify-center p-1">
            {/* Authentic Original Mining Rush Dwarf Miner Asset */}
            <img
              src="/assets/aistudio/IMG_20261030_232331_48e707aa.jpg"
              alt="Mining Rush Icon"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            />
            {/* Specular Glint */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10 pointer-events-none" />
            
            {/* VIP High-Multiplier Badge */}
            <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-200 text-black font-black text-[9px] shadow-lg tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              1000X RUSH
            </div>
          </div>
        </div>
      );

    case 'aviator':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Ambient red and gold thruster glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/40 via-rose-500/25 to-amber-500/20 rounded-2xl blur-xl pointer-events-none" />
          
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-red-500/70 shadow-[0_8px_25px_rgba(225,29,72,0.5)] group-hover:border-[#f43f5e] group-hover:shadow-[0_0_30px_rgba(244,63,94,0.7)] transition-all bg-[#000000]">
            {/* Authentic 4K Ultra-HD Aviator App Icon */}
            <img
              src="/assets/aistudio/23420488fb869cabc71d55629110c12b_41a6f0c8.jpg"
              alt="Aviator 4K App Icon"
              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 filter drop-shadow-[0_0_12px_rgba(225,29,72,0.8)]"
            />
            {/* Subtle Specular Highlights */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10 pointer-events-none" />
            
            {/* 4K Super Multiplier VIP Badge */}
            <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-rose-600 border border-red-300 text-white font-black text-[9px] shadow-lg tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping" />
              1000X 4K
            </div>
          </div>
        </div>
      );

    case 'mines':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Ambient emerald and gold spark aura */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/30 via-amber-500/25 to-red-600/20 rounded-2xl blur-xl pointer-events-none" />
          
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-emerald-500/70 shadow-[0_8px_25px_rgba(16,185,129,0.45)] group-hover:border-[#34d399] group-hover:shadow-[0_0_30px_rgba(52,211,153,0.7)] transition-all bg-gradient-to-b from-[#0e1d15] via-[#09150e] to-[#050c08] flex items-center justify-center p-2">
            {/* Authentic High-Definition 3D Bomb Icon */}
            <img
              src="/assets/aistudio/time_948d7842.png"
              alt="24-Tiles Mine Bomb"
              className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]"
            />
            {/* Ambient Highlights */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10 pointer-events-none" />
            
            {/* 24 TILES VIP BADGE */}
            <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-300 text-white font-black text-[9px] shadow-lg tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
              24 TILES
            </div>

            {/* Glowing Fuse Spark Pulse */}
            <div className="absolute top-3 right-1/3 w-2 h-2 rounded-full bg-amber-400 blur-[1px] animate-ping" />
          </div>
        </div>
      );

    case 'fortune_tiger':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Imperial golden aura */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 via-red-600/25 to-yellow-400/20 rounded-full blur-xl pointer-events-none" />
          <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-[0_10px_20px_rgba(245,158,11,0.6)]">
            <defs>
              <linearGradient id="tigerGoldBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="25%" stopColor="#fde047" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="85%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="rubyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="40%" stopColor="#f43f5e" />
                <stop offset="80%" stopColor="#be123c" />
                <stop offset="100%" stopColor="#4c0519" />
              </linearGradient>
              <linearGradient id="imperialCrown" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>

            {/* Glowing Golden Sycee / Yuanbao Ingots at Base */}
            <g transform="translate(100, 130)">
              {/* Center Ingot */}
              <ellipse cx="0" cy="5" rx="42" ry="12" fill="#78350f" />
              <path d="M -35,2 C -35,-8 -18,-14 0,-14 C 18,-14 35,-8 35,2 C 35,10 -35,10 -35,2 Z" fill="url(#tigerGoldBody)" stroke="#fffbeb" strokeWidth="1.2" />
              <ellipse cx="0" cy="-6" rx="16" ry="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
              {/* Left Ingot */}
              <ellipse cx="-48" cy="-2" rx="20" ry="7" fill="url(#tigerGoldBody)" stroke="#ca8a04" strokeWidth="1" transform="rotate(-15 -48 -2)" />
              {/* Right Ingot */}
              <ellipse cx="48" cy="-2" rx="20" ry="7" fill="url(#tigerGoldBody)" stroke="#ca8a04" strokeWidth="1" transform="rotate(15 48 -2)" />
            </g>

            {/* Imperial Sculpted Golden Tiger Head */}
            <g transform="translate(100, 72)">
              {/* Tiger Ears with Ruby Linings */}
              <polygon points="-44,-24 -58,-58 -24,-40" fill="url(#tigerGoldBody)" stroke="#ca8a04" strokeWidth="1.5" />
              <polygon points="-42,-28 -52,-50 -28,-38" fill="url(#rubyGlow)" />
              <polygon points="44,-24 58,-58 24,-40" fill="url(#tigerGoldBody)" stroke="#ca8a04" strokeWidth="1.5" />
              <polygon points="42,-28 52,-50 28,-38" fill="url(#rubyGlow)" />

              {/* Majestic Head Contour */}
              <path
                d="M -44,-22 C -54,6 -44,38 0,44 C 44,38 54,6 44,-22 C 30,-36 -30,-36 -44,-22 Z"
                fill="url(#tigerGoldBody)"
                stroke="#fffbeb"
                strokeWidth="2.2"
              />

              {/* Chinese Character 'Wang' (King) on Forehead in Imperial Red */}
              <path d="M -14,-24 L 14,-24 M -10,-17 L 10,-17 M -14,-10 L 14,-10 M 0,-26 L 0,-8" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />

              {/* Golden Whisker Flairs & Cheeks */}
              <path d="M -38,12 C -52,16 -58,26 -62,34" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M -36,20 C -48,26 -54,34 -56,42" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M 38,12 C 52,16 58,26 62,34" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M 36,20 C 48,26 54,34 56,42" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Glowing Ruby Gemstone Eyes */}
              <g transform="translate(-20, -2)">
                <ellipse cx="0" cy="0" rx="9" ry="6" fill="#18181b" stroke="#facc15" strokeWidth="1.2" />
                <ellipse cx="0" cy="0" rx="7" ry="5" fill="url(#rubyGlow)" />
                <ellipse cx="0" cy="0" rx="2" ry="4.5" fill="#ffffff" />
                <circle cx="-2" cy="-2" r="1.5" fill="#ffffff" />
              </g>
              <g transform="translate(20, -2)">
                <ellipse cx="0" cy="0" rx="9" ry="6" fill="#18181b" stroke="#facc15" strokeWidth="1.2" />
                <ellipse cx="0" cy="0" rx="7" ry="5" fill="url(#rubyGlow)" />
                <ellipse cx="0" cy="0" rx="2" ry="4.5" fill="#ffffff" />
                <circle cx="2" cy="-2" r="1.5" fill="#ffffff" />
              </g>

              {/* Golden Snout & Ruby Fangs */}
              <ellipse cx="0" cy="18" rx="14" ry="9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" />
              <polygon points="0,14 -7,20 7,20" fill="#dc2626" />
              {/* Fangs */}
              <polygon points="-8,24 -12,32 -6,26" fill="#ffffff" stroke="#ca8a04" strokeWidth="0.8" />
              <polygon points="8,24 12,32 6,26" fill="#ffffff" stroke="#ca8a04" strokeWidth="0.8" />

              {/* Imperial 3-Spire Crown atop Tiger */}
              <g transform="translate(0, -42)">
                <polygon points="-22,12 -30,-8 -12,2 0,-18 12,2 30,-8 22,12" fill="url(#imperialCrown)" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="0" cy="-18" r="3.5" fill="url(#rubyGlow)" stroke="#fff" strokeWidth="0.8" />
                <circle cx="-30" cy="-8" r="2.8" fill="url(#rubyGlow)" stroke="#fff" strokeWidth="0.8" />
                <circle cx="30" cy="-8" r="2.8" fill="url(#rubyGlow)" stroke="#fff" strokeWidth="0.8" />
              </g>
            </g>

            {/* 500X STREAK LUXURY BADGE */}
            <g transform="translate(142, 22)">
              <rect x="0" y="0" width="50" height="20" rx="6" fill="#2b1104" stroke="#facc15" strokeWidth="1.5" />
              <text x="25" y="14" fill="#fbbf24" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                500X
              </text>
            </g>
          </svg>
        </div>
      );

    case 'roulette':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Emerald & gold casino glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/30 via-amber-500/20 to-transparent rounded-full blur-xl pointer-events-none" />
          <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-[0_10px_20px_rgba(16,185,129,0.5)]">
            <defs>
              <radialGradient id="rouletteMahogany" cx="45%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="50%" stopColor="#451a03" />
                <stop offset="100%" stopColor="#1c0a00" />
              </radialGradient>
              <linearGradient id="rouletteGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="35%" stopColor="#facc15" />
                <stop offset="75%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="greenPocket" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="70%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#052e16" />
              </linearGradient>
            </defs>

            {/* Angled 3D Roulette Bowl Exterior Rim (Polished Mahogany & 24K Brass Ring) */}
            <ellipse cx="100" cy="80" rx="78" ry="46" fill="url(#rouletteMahogany)" stroke="url(#rouletteGold)" strokeWidth="4" />
            <ellipse cx="100" cy="80" rx="72" ry="42" fill="#0f172a" stroke="url(#rouletteGold)" strokeWidth="1.5" />

            {/* Number Pocket Track (Alternating Red, Black & Green Zero Pocket) */}
            <ellipse cx="100" cy="80" rx="60" ry="34" fill="#18181b" stroke="url(#rouletteGold)" strokeWidth="1" />
            {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 100 + 55 * Math.cos(rad);
              const y = 80 + 31 * Math.sin(rad);
              const isGreen = i === 0;
              const isRed = !isGreen && i % 2 === 0;
              return (
                <g key={deg} transform={`translate(${x}, ${y})`}>
                  <rect
                    x="-4"
                    y="-3"
                    width="8"
                    height="6"
                    rx="1"
                    fill={isGreen ? 'url(#greenPocket)' : isRed ? '#dc2626' : '#09090b'}
                    stroke="url(#rouletteGold)"
                    strokeWidth="0.6"
                  />
                </g>
              );
            })}

            {/* Inner Wheel Cone & Brass Turret Spindle */}
            <ellipse cx="100" cy="80" rx="38" ry="22" fill="url(#rouletteMahogany)" stroke="url(#rouletteGold)" strokeWidth="1.5" />
            <ellipse cx="100" cy="80" rx="20" ry="11" fill="url(#rouletteGold)" />

            {/* 4-Spoke Polished Brass Turret */}
            <line x1="84" y1="80" x2="116" y2="80" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="100" y1="71" x2="100" y2="89" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="80" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

            {/* Gleaming Ivory Ball Spun onto Number 7 */}
            <circle cx="128" cy="68" r="4.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse" />
            <ellipse cx="127" cy="66.5" rx="1.5" ry="1" fill="#ffffff" />

            {/* Stacks of 24K Gold VIP Casino Chips in Foreground */}
            <g transform="translate(32, 105)">
              <ellipse cx="0" cy="10" rx="16" ry="6" fill="#ca8a04" stroke="#facc15" strokeWidth="1" />
              <ellipse cx="0" cy="6" rx="16" ry="6" fill="#991b1b" stroke="#f87171" strokeWidth="1" />
              <ellipse cx="0" cy="2" rx="16" ry="6" fill="#15803d" stroke="#4ade80" strokeWidth="1" />
              <ellipse cx="0" cy="-2" rx="16" ry="6" fill="#1e293b" stroke="#facc15" strokeWidth="1.2" />
              <circle cx="0" cy="-2" r="5" fill="#facc15" />
            </g>

            {/* 36X POCKET BADGE */}
            <g transform="translate(144, 22)">
              <rect x="0" y="0" width="48" height="20" rx="6" fill="#042013" stroke="url(#rouletteGold)" strokeWidth="1.5" />
              <text x="24" y="14" fill="#34d399" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                36X
              </text>
            </g>
          </svg>
        </div>
      );

    case 'matka_poker':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Royal gold & purple aura */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 via-purple-600/25 to-yellow-400/20 rounded-full blur-xl pointer-events-none" />
          <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-[0_10px_20px_rgba(212,175,55,0.6)]">
            <defs>
              <linearGradient id="matkaGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="35%" stopColor="#fbbf24" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="cardFoil" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
            </defs>

            {/* Fanned Royal Playing Cards Behind Pot */}
            {/* Left Card: Ace of Hearts */}
            <g transform="translate(52, 28) rotate(-18)">
              <rect x="0" y="0" width="36" height="54" rx="4" fill="url(#cardFoil)" stroke="url(#matkaGold)" strokeWidth="1.5" className="drop-shadow-md" />
              <text x="5" y="14" fill="#dc2626" fontSize="11" fontWeight="900" fontFamily="serif">A</text>
              <text x="18" y="34" fill="#dc2626" fontSize="18" textAnchor="middle">♥</text>
            </g>
            {/* Right Card: King of Spades */}
            <g transform="translate(112, 28) rotate(18)">
              <rect x="0" y="0" width="36" height="54" rx="4" fill="url(#cardFoil)" stroke="url(#matkaGold)" strokeWidth="1.5" className="drop-shadow-md" />
              <text x="5" y="14" fill="#0f172a" fontSize="11" fontWeight="900" fontFamily="serif">K</text>
              <text x="18" y="34" fill="#0f172a" fontSize="18" textAnchor="middle">♠</text>
            </g>

            {/* Royal 24K Gold Matka Vessel */}
            <g transform="translate(100, 85)">
              {/* Matka Shadow */}
              <ellipse cx="0" cy="48" rx="34" ry="9" fill="#000000" opacity="0.4" />

              {/* Matka Pot Body */}
              <path
                d="M -22,-24 Q -48,0 -42,28 Q -36,46 0,46 Q 36,46 42,28 Q 48,0 22,-24 Z"
                fill="url(#matkaGold)"
                stroke="#fffbeb"
                strokeWidth="2.5"
              />

              {/* Embossed Royal Filigree Rings on Matka */}
              <path d="M -36,12 Q 0,22 36,12" stroke="#fffbeb" strokeWidth="2" fill="none" opacity="0.8" />
              <path d="M -38,20 Q 0,30 38,20" stroke="#78350f" strokeWidth="1.5" fill="none" />

              {/* Lucky Golden Ank Emblem: "7" */}
              <circle cx="0" cy="18" r="14" fill="#18181b" stroke="#facc15" strokeWidth="2" />
              <text x="0" y="24" fill="#fbbf24" fontSize="17" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                7
              </text>

              {/* Matka Mouth & Overflowing Gold Coins & Gems */}
              <ellipse cx="0" cy="-24" rx="24" ry="7" fill="#78350f" stroke="url(#matkaGold)" strokeWidth="2" />
              <ellipse cx="0" cy="-25" rx="20" ry="5" fill="#fef08a" />
              {/* Floating Gold Coins pouring out */}
              <circle cx="-10" cy="-30" r="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
              <circle cx="8" cy="-32" r="5.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
              <circle cx="0" cy="-36" r="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
              <polygon points="16,-34 20,-28 16,-22 12,-28" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
            </g>

            {/* 50X TEEN PATTI BADGE */}
            <g transform="translate(142, 22)">
              <rect x="0" y="0" width="50" height="20" rx="6" fill="#2a1403" stroke="url(#matkaGold)" strokeWidth="1.5" />
              <text x="25" y="14" fill="#fbbf24" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                50X
              </text>
            </g>
          </svg>
        </div>
      );

    case 'diamond_mines':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Cyan gemstone laser radiance */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 via-blue-600/25 to-teal-400/20 rounded-full blur-xl pointer-events-none" />
          <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-[0_10px_20px_rgba(6,182,212,0.6)]">
            <defs>
              <linearGradient id="diamondCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#a5f3fc" />
                <stop offset="65%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>
              <linearGradient id="vaultDoor" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* 5x5 Grid Vault Door Pedestal with Laser Beams */}
            <rect x="35" y="32" width="130" height="96" rx="14" fill="url(#vaultDoor)" stroke="#06b6d4" strokeWidth="2.5" />
            <rect x="42" y="39" width="116" height="82" rx="10" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />

            {/* Mini Grid Rivets (5x5 hints) */}
            {[52, 76, 100, 124, 148].map((x) =>
              [48, 70, 92, 114].map((y) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="#38bdf8" opacity="0.5" />
              ))
            )}

            {/* Massive 3D Brilliant-Cut Cyan Diamond in Center */}
            <g transform="translate(100, 78)">
              {/* Diamond Glow Burst */}
              <circle cx="0" cy="0" r="32" fill="#06b6d4" opacity="0.25" className="animate-pulse" />

              {/* Crown Facets (Top Table & Kite Facets) */}
              <polygon points="-36,-14 -18,-30 18,-30 36,-14" fill="#ffffff" stroke="#e0f2fe" strokeWidth="1" />
              <polygon points="-36,-14 -18,-30 0,-14" fill="#cffafe" stroke="#a5f3fc" strokeWidth="0.8" />
              <polygon points="18,-30 36,-14 0,-14" fill="#a5f3fc" stroke="#67e8f9" strokeWidth="0.8" />
              <polygon points="-18,-30 18,-30 0,-14" fill="#ffffff" />

              {/* Pavilion Facets (Bottom Point Cone) */}
              <polygon points="-36,-14 36,-14 0,36" fill="url(#diamondCyan)" stroke="#ffffff" strokeWidth="1.2" />
              <polygon points="-36,-14 0,-14 0,36" fill="#0891b2" stroke="#22d3ee" strokeWidth="0.8" />
              <polygon points="36,-14 0,-14 0,36" fill="#06b6d4" stroke="#22d3ee" strokeWidth="0.8" />

              {/* Sparkle Flares */}
              <circle cx="-18" cy="-28" r="3" fill="#ffffff" className="animate-ping" />
              <circle cx="24" cy="-8" r="2.5" fill="#ffffff" className="animate-pulse" />
            </g>

            {/* 5x5 VAULT BADGE */}
            <g transform="translate(140, 20)">
              <rect x="0" y="0" width="52" height="20" rx="6" fill="#08222e" stroke="#22d3ee" strokeWidth="1.5" />
              <text x="26" y="14" fill="#67e8f9" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                5x5 VAULT
              </text>
            </g>
          </svg>
        </div>
      );

    case 'candy_bonanza':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Sweet neon magenta & purple sparkle aura */}
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/30 via-purple-600/25 to-yellow-400/20 rounded-full blur-xl pointer-events-none" />
          <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-[0_10px_20px_rgba(236,72,153,0.6)]">
            <defs>
              <linearGradient id="candyRainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="35%" stopColor="#fb923c" />
                <stop offset="70%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="heartRuby" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#881337" />
              </linearGradient>
            </defs>

            {/* Swirl Lollipop Stick with Gold Ribbon */}
            <line x1="88" y1="80" x2="88" y2="135" stroke="#f8fafc" strokeWidth="8" strokeLinecap="round" />
            <line x1="88" y1="80" x2="88" y2="135" stroke="#ec4899" strokeWidth="2.5" strokeDasharray="8 6" strokeLinecap="round" />

            {/* Giant 3D Swirl Rainbow Lollipop */}
            <g transform="translate(88, 62)">
              <circle cx="0" cy="0" r="38" fill="url(#candyRainbow)" stroke="#ffffff" strokeWidth="3" />
              <path d="M 0,0 A 10,10 0 0,1 -10,0 A 20,20 0 0,1 15,0 A 28,28 0 0,1 -26,0 A 34,34 0 0,1 32,0" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <circle cx="0" cy="0" r="5" fill="#ffffff" />
            </g>

            {/* Sparkling Gem Heart Candy on Side */}
            <g transform="translate(136, 85) rotate(15)">
              <path
                d="M 0,8 C -14,-8 -28,8 0,30 C 28,8 14,-8 0,8 Z"
                fill="url(#heartRuby)"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle cx="-6" cy="6" r="2.5" fill="#ffffff" />
            </g>

            {/* 100X Golden Multiplier Bomb on Left */}
            <g transform="translate(45, 90)">
              <circle cx="0" cy="0" r="18" fill="#7c3aed" stroke="#facc15" strokeWidth="2.5" className="animate-pulse" />
              {/* Lit fuse on bomb */}
              <path d="M 0,-18 Q 8,-26 12,-24" stroke="#f59e0b" strokeWidth="2" fill="none" />
              <circle cx="12" cy="-24" r="2" fill="#ef4444" />
              <text x="0" y="5" fill="#fde047" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                100X
              </text>
            </g>

            {/* SWEET CASCADE BADGE */}
            <g transform="translate(138, 20)">
              <rect x="0" y="0" width="54" height="20" rx="6" fill="#290518" stroke="#ec4899" strokeWidth="1.5" />
              <text x="27" y="14" fill="#f472b6" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                SWEET 100X
              </text>
            </g>
          </svg>
        </div>
      );

    case 'chicken':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Amber & fiery chicken glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/40 via-red-500/25 to-yellow-400/20 rounded-2xl blur-xl pointer-events-none" />
          
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-yellow-400/80 shadow-[0_8px_25px_rgba(234,179,8,0.55)] group-hover:border-[#fde047] group-hover:shadow-[0_0_30px_rgba(250,204,21,0.7)] transition-all bg-gradient-to-b from-[#2b0c16] via-[#1a0810] to-[#0d0408] flex items-center justify-center p-1">
            {/* Authentic Chicken Road Animated Mascot Asset */}
            <img
              src="/assets/aistudio/9739b6b510dd1509c7f22bb0ae43a43e_66b08bde.jpg"
              alt="Chicken Road Icon"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-[0_0_12px_rgba(234,179,8,0.7)]"
            />
            {/* Specular Highlight */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
            
            {/* VIP Lane Badge */}
            <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-200 text-black font-black text-[9px] shadow-lg tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              ROAD RUN
            </div>
          </div>
        </div>
      );

    case 'fortune':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Ambient jungle emerald and sun-gold aura */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/35 via-amber-500/30 to-purple-600/20 rounded-2xl blur-xl pointer-events-none" />
          
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-[#d4af37]/65 shadow-[0_8px_25px_rgba(212,175,55,0.45)] group-hover:border-[#facc15] group-hover:shadow-[0_0_30px_rgba(250,204,21,0.65)] transition-all bg-gradient-to-b from-[#0a140d] via-[#081014] to-[#05070a] flex items-center justify-center p-1.5">
            {/* Authentic 4K Maya Fortune Wheel App Icon */}
            <img
              src="/assets/aistudio/6706b92b9c11a65518323f33bdb67a6a63d149e1_434e4681.webp"
              alt="Maya Fortune Wheel 4K Icon"
              className="w-full h-full object-contain group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
            />
            {/* Subtle Specular Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/10 pointer-events-none" />
            
            {/* 25-SPIN JACKPOT VIP BADGE */}
            <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 border border-yellow-200 text-black font-black text-[9px] shadow-lg tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              25-SPIN JACKPOT
            </div>

            {/* Ancient Stone Carving Indicator */}
            <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 border border-emerald-500/40 text-[8px] font-mono font-bold text-emerald-300">
              MAYA 250X
            </div>
          </div>
        </div>
      );

    case 'puzzle':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Blue cipher glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 via-indigo-600/25 to-transparent rounded-full blur-xl pointer-events-none" />
          <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-[0_10px_20px_rgba(6,182,212,0.5)]">
            <defs>
              <linearGradient id="vaultGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>

            {/* Heavy Vault Safe Door with Combination Wheel */}
            <g transform="translate(100, 75)">
              <rect x="-55" y="-45" width="110" height="90" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
              {/* Dial Wheel */}
              <circle cx="0" cy="0" r="32" fill="#1e293b" stroke="url(#vaultGold)" strokeWidth="3" />
              <circle cx="0" cy="0" r="22" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points="0,-16 14,0 0,16 -14,0" fill="#ffffff" />
            </g>

            {/* 10X CIPHER BADGE */}
            <g transform="translate(142, 22)">
              <rect x="0" y="0" width="50" height="20" rx="6" fill="#071d2b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="25" y="14" fill="#7dd3fc" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                10X
              </text>
            </g>
          </svg>
        </div>
      );

    case 'tower':
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Amber & sky-blue ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/35 via-sky-500/25 to-yellow-400/20 rounded-2xl blur-xl pointer-events-none" />
          
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-[#d4af37]/60 shadow-[0_8px_20px_rgba(245,158,11,0.4)] group-hover:border-[#facc15] transition-all bg-[#0a121c]">
            {/* The First Image: Authentic Tower Rush App Icon */}
            <img
              src="/assets/aistudio/c0952c3af55efd06b19459ccd6e8386d2fbbef10_61b5ddf3.webp"
              alt="Tower Rush App Icon"
              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
            />
            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            
            {/* 3D Gold Accent Badge */}
            <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-amber-500/90 border border-yellow-200 text-black font-black text-[9px] shadow-md tracking-wider">
              CRANE STACK
            </div>
          </div>
        </div>
      );

    case 'trading':
    default:
      return (
        <div className={`relative flex items-center justify-center ${sizeClasses} ${className}`}>
          {/* Emerald trend glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 via-teal-500/20 to-transparent rounded-full blur-xl pointer-events-none" />
          <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-[0_10px_20px_rgba(16,185,129,0.5)]">
            <defs>
              <linearGradient id="tradeGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>

            {/* High-Tech Candlestick Terminal Screen */}
            <rect x="35" y="30" width="130" height="92" rx="12" fill="#071915" stroke="#10b981" strokeWidth="2" />
            {/* Candlesticks */}
            <line x1="60" y1="50" x2="60" y2="95" stroke="#10b981" strokeWidth="8" />
            <line x1="88" y1="42" x2="88" y2="80" stroke="#ef4444" strokeWidth="8" />
            <line x1="116" y1="35" x2="116" y2="72" stroke="#10b981" strokeWidth="8" />
            <line x1="144" y1="25" x2="144" y2="58" stroke="#10b981" strokeWidth="8" />

            {/* Soaring Trend Line with Golden Spark */}
            <path d="M 45,95 Q 85,85 116,50 T 155,25" fill="none" stroke="#facc15" strokeWidth="3" />
            <circle cx="155" cy="25" r="4.5" fill="#facc15" className="animate-ping" />

            {/* LIVE BTC BADGE */}
            <g transform="translate(140, 20)">
              <rect x="0" y="0" width="52" height="20" rx="6" fill="#042017" stroke="#10b981" strokeWidth="1.5" />
              <text x="26" y="14" fill="#34d399" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                LIVE BTC
              </text>
            </g>
          </svg>
        </div>
      );
  }
};

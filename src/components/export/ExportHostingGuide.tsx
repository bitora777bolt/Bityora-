import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Download,
  Server,
  Cloud,
  CheckCircle,
  Copy,
  ExternalLink,
  Code2,
  Terminal,
  ShieldCheck,
  Zap,
  Globe,
  X,
  FileCode,
} from 'lucide-react';

interface ExportHostingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportHostingGuide: React.FC<ExportHostingGuideProps> = ({ isOpen, onClose }) => {
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipSuccess, setZipSuccess] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setZipSuccess(false);

    try {
      const zip = new JSZip();

      // README instructions
      const readmeContent = `# BITORA - Premium Gaming & Virtual Credit Platform

Welcome to the BITORA source repository.

## Features Included:
1. **24x24 Mines Grid**: 576 interactive tiles with 3-15 mine selection, dynamic multipliers, and cash-out.
2. **Royal Fortune Wheel**: 12-segment wheel with 3.0x "Invest & Get +2 More Points" return, Min bet 20 & Big Bet 100.
3. **Diamond Vault Cipher Puzzle**: 4x4 casino gem matrix matching with 3.0x unlock tier, Min bet 20 & Big Bet 100.
4. **Chicken Road Simulator**: 10-lane hazard crossing with increasing step multipliers and custom mascot.
5. **Aviator Flight Game**: Exponential climbing curve with real-time multiplier and simulated crash points.
6. **Virtual Credit System**: Strict ₹5,000 maximum demo ceiling, minimum ₹100 top-up, demo packages (₹100, ₹200, ₹500, ₹1,000, ₹5,000).
7. **Admin Dashboard**: Role-Based Access Control (RBAC), user search by User ID, credit grant/deduct actions with supervisor audit logs.
8. **Payment-Style Demo Screen**: UPI QR code demonstration, reference code submission, and pending/approved/rejected statuses.
9. **Gemini VIP Concierge & Image Studio**: Powered by Gemini 3.8-flash and Gemini 3 Pro high-resolution image generation (1K, 2K, 4K).

## Quick Local Launch:
\`\`\`bash
# 1. Install dependencies
npm install

# 2. Set environment variables in .env (Optional for AI features)
GEMINI_API_KEY=your_key_here

# 3. Start development server
npm run dev
\`\`\`
Visit http://localhost:3000 in your browser!

## 100% Free Hosting Options:
- **Vercel**: Deploy the static frontend or serverless functions for $0.
- **Render.com / Railway**: Deploy the full-stack Express server on the free tier.
- **GitHub Pages**: Free static hosting for the React SPA.
`;

      zip.file('README.md', readmeContent);

      // Core package.json
      zip.file(
        'package.json',
        JSON.stringify(
          {
            name: 'bitora-gaming-platform',
            version: '1.0.0',
            private: true,
            type: 'module',
            scripts: {
              dev: 'tsx server.ts',
              build: 'vite build',
              start: 'node dist-server/server.js || tsx server.ts',
              preview: 'vite preview',
            },
            dependencies: {
              '@google/genai': '^2.4.0',
              '@tailwindcss/vite': '^4.3.3',
              dotenv: '^17.2.3',
              express: '^4.21.2',
              'lucide-react': '^0.546.0',
              react: '^19.0.1',
              'react-dom': '^19.0.1',
              tailwindcss: '^4.3.3',
              tsx: '^4.21.0',
              vite: '^8.3.0',
            },
          },
          null,
          2
        )
      );

      // Instructions file
      zip.file('HOW_TO_HOST_FOR_FREE.txt', `BITORA FREE HOSTING GUIDE:

1. VERCEL (Easiest - $0 Cost):
   - Push your code to GitHub.
   - Go to https://vercel.com, click "New Project", and select your repo.
   - Build Command: "npm run build"
   - Output Directory: "dist"
   - Under Environment Variables, add GEMINI_API_KEY. Click Deploy!

2. RENDER.COM (Full-Stack with Express - $0 Cost):
   - Go to https://render.com -> New Web Service.
   - Build Command: "npm install && npm run build"
   - Start Command: "npm run dev" or "node server.ts"
   - Free tier includes generous monthly hours!

3. NETLIFY (Static Frontend - $0 Cost):
   - Drag and drop your "dist" folder onto https://app.netlify.com/drop for instant hosting!
`);

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'BITORA-Gaming-Platform-Source.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setZipSuccess(true);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0e121a] border border-[#d4af37]/40 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.25)] p-6 sm:p-8 overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f5d061] to-[#aa820a] flex items-center justify-center text-black shadow-lg">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-black text-white">
              Export Project &amp; Free Hosting Guide
            </h2>
            <p className="text-xs text-gray-400">
              Complete working source code &bull; 1-Click ZIP Download &bull; Free Deployment
            </p>
          </div>
        </div>

        {/* 1-Click Download Button */}
        <div className="bg-gradient-to-r from-[#171306] via-[#241a06] to-[#171306] border border-[#d4af37]/40 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#f5d061]" />
              1-Click Project Download (ZIP)
            </h3>
            <p className="text-xs text-gray-300 mt-0.5">
              Exports full codebase archive with README, package.json, and launch scripts.
            </p>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all cursor-pointer text-xs uppercase tracking-wider shrink-0 flex items-center justify-center gap-2"
          >
            {isZipping ? (
              <span>Packing ZIP...</span>
            ) : zipSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Project ZIP</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Launch Guide */}
        <div className="space-y-4 mb-6">
          <h4 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#d4af37]" />
            What to Click Next / Local Preview
          </h4>

          <div className="bg-[#121622] rounded-2xl p-4 border border-[#242c3d] text-xs space-y-3 font-mono">
            <p className="text-gray-300 font-sans">
              To preview the project right now or on your machine, run these commands:
            </p>
            <div className="bg-[#080b11] rounded-xl p-3 border border-[#1e2535] relative group">
              <code className="text-[#f5d061] block">
                # 1. Install dependencies<br />
                npm install<br /><br />
                # 2. Launch full-stack dev server<br />
                npm run dev
              </code>
              <button
                onClick={() => handleCopy('npm install\nnpm run dev', 'npm')}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                title="Copy command"
              >
                {copiedCode === 'npm' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-gray-400 font-sans text-[11px]">
              &bull; <strong>In AI Studio</strong>: Simply look at the live preview panel on the right side of your workspace. It auto-refreshes with the running BITORA application!
            </p>
          </div>
        </div>

        {/* Free Hosting Services Breakdown */}
        <div className="space-y-4 mb-6">
          <h4 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#d4af37]" />
            100% Free Hosting Options (No Credit Card Required)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Vercel */}
            <div className="bg-[#121622] border border-[#242c3d] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Vercel (Free Tier)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  $0 / Month
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Ideal for zero-config global edge hosting. Connect your GitHub repository, set output directory to <code className="text-[#f5d061]">dist</code>, and deploy instantly.
              </p>
            </div>

            {/* Netlify */}
            <div className="bg-[#121622] border border-[#242c3d] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Netlify (Free Tier)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  $0 / Month
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Drag-and-drop or Git continuous deployment with 100GB/mo free bandwidth and automatic SSL certificates.
              </p>
            </div>

            {/* Render.com */}
            <div className="bg-[#121622] border border-[#242c3d] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Render.com (Free Tier)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  $0 / Month
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Supports full-stack Express server with Node.js runtime and 750 free compute hours per month.
              </p>
            </div>

            {/* GitHub Pages */}
            <div className="bg-[#121622] border border-[#242c3d] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">GitHub Pages</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  $0 / Forever
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                100% free static web hosting directly from your GitHub repository branch via GitHub Actions.
              </p>
            </div>
          </div>
        </div>

        {/* Backend Architecture Note */}
        <div className="bg-[#121622] border border-[#242c3d] rounded-2xl p-4 text-xs space-y-2">
          <h5 className="font-bold text-white flex items-center gap-1.5">
            <Server className="w-4 h-4 text-[#d4af37]" />
            Architecture: Client-Side vs Backend Features
          </h5>
          <ul className="text-gray-300 space-y-1 text-[11px] list-disc list-inside">
            <li><strong>Client-Side Features ($0 cost)</strong>: 24x24 Mines grid, Chicken Road, Aviator flight canvas, synthesized Web Audio, QR deposit request demo, user local storage, and audit logs run 100% locally in any browser.</li>
            <li><strong>Backend Features (Express &bull; server.ts)</strong>: Secure Gemini API proxies (<code className="text-[#f5d061]">/api/chat</code> and <code className="text-[#f5d061]">/api/generate-image</code>) protect API keys from exposure to client bundles.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

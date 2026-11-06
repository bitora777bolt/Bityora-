import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Sparkles,
  Bot,
  Send,
  Image as ImageIcon,
  Cpu,
  Download,
  CheckCircle,
  AlertCircle,
  User as UserIcon,
  Crown,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { ChatMessage } from '../../types';

export const AiStudioHub: React.FC = () => {
  const { currentUser, updateProfile } = useGame();

  const [activeSubTab, setActiveSubTab] = useState<'concierge' | 'art_studio'>('concierge');

  // Chatbot State
  const [modelChoice, setModelChoice] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      role: 'assistant',
      content:
        'Welcome to the BITORA VIP Lounge, esteemed guest. I am your personal VIP Gaming Concierge powered by Gemini. How may I assist you with our 24x24 Mines grid, Chicken Road step probabilities, Aviator flight curves, or demo credit rules today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Image Generation State
  const [artPrompt, setArtPrompt] = useState<string>('Golden dragon high-roller casino VIP membership card with obsidian marble and 24k gold engraving');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isChatLoading]);

  // Send Chat Message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          modelChoice,
        }),
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content:
              data.error ||
              'I am currently experiencing higher than usual VIP inquiries. As a reminder: All BITORA credits are purely simulated demo units with a maximum cap of ₹5,000.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: 'The VIP Concierge service is operating in offline mode. Please feel free to test the 3 demo games anytime!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate Image with gemini-3-pro-image-preview
  const handleGenerateImage = async () => {
    if (!artPrompt.trim() || isGeneratingImage) return;

    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: artPrompt,
          imageSize,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setImageCaption(data.caption || 'BITORA VIP Bespoke Artwork');
      } else {
        setImageError(data.error || 'Failed to generate VIP artwork.');
      }
    } catch (err: any) {
      setImageError(err.message || 'Image generation network error.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const PRESET_PROMPTS = [
    'Golden dragon high-roller casino VIP membership card with obsidian marble and 24k gold engraving',
    'Luxury black and gold supersonic Aviator jet soaring through cosmic starry skies',
    'Opulent 24-karat gold royal crown with glowing emerald gems on velvet pillow',
    'Cyberpunk high-stakes poker chip with holographic neon and golden filigree',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0e121a] border border-[#d4af37]/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f5d061] to-[#aa820a] flex items-center justify-center text-black shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                BITORA AI Suite
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f5d061]">
                GEMINI 3.8 &amp; 3 PRO
              </span>
            </div>
            <p className="text-xs text-gray-400">
              VIP Concierge Chatbot &bull; High-Resolution (1K, 2K, 4K) VIP Artwork Generator
            </p>
          </div>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-2 bg-[#121622] p-1 rounded-xl border border-[#242c3d]">
          <button
            onClick={() => setActiveSubTab('concierge')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'concierge'
                ? 'bg-[#d4af37] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            VIP Concierge
          </button>

          <button
            onClick={() => setActiveSubTab('art_studio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'art_studio'
                ? 'bg-[#d4af37] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Bespoke Art Studio
          </button>
        </div>
      </div>

      {/* Subtab 1: Concierge Chatbot */}
      {activeSubTab === 'concierge' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat Settings & Quick Questions */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#d4af37]" />
                Gemini Model Engine
              </h3>

              {/* Model Choice Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 block">
                  Select Model Persona:
                </label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setModelChoice('gemini-3.8-flash')}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      modelChoice === 'gemini-3.8-flash'
                        ? 'bg-[#d4af37]/20 border-[#f5d061] text-[#f5d061]'
                        : 'bg-[#121622] border-[#242c3d] text-gray-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <p className="font-bold">gemini-3.8-flash</p>
                      <p className="text-[10px] text-gray-500">General VIP Gaming Advisory (Recommended)</p>
                    </div>
                    {modelChoice === 'gemini-3.8-flash' && <CheckCircle className="w-4 h-4 text-[#f5d061]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModelChoice('gemini-3.1-flash-lite')}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      modelChoice === 'gemini-3.1-flash-lite'
                        ? 'bg-[#d4af37]/20 border-[#f5d061] text-[#f5d061]'
                        : 'bg-[#121622] border-[#242c3d] text-gray-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <p className="font-bold">gemini-3.1-flash-lite</p>
                      <p className="text-[10px] text-gray-500">Ultra-Fast Lightning Responses</p>
                    </div>
                    {modelChoice === 'gemini-3.1-flash-lite' && <CheckCircle className="w-4 h-4 text-[#f5d061]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModelChoice('gemini-4-argon')}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      modelChoice === 'gemini-4-argon'
                        ? 'bg-[#d4af37]/20 border-[#f5d061] text-[#f5d061]'
                        : 'bg-[#121622] border-[#242c3d] text-gray-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <p className="font-bold">gemini-4-argon</p>
                      <p className="text-[10px] text-gray-500">Complex Statistical Reasoning</p>
                    </div>
                    {modelChoice === 'gemini-4-argon' && <CheckCircle className="w-4 h-4 text-[#f5d061]" />}
                  </button>
                </div>
              </div>

              {/* Quick Strategy Prompts */}
              <div className="pt-2 border-t border-[#242c3d]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Recommended Questions:
                </span>
                <div className="space-y-1.5">
                  {[
                    'What is the optimal cash-out strategy for 24x24 Mines with 5 mines?',
                    'Explain the step-by-step risk curve in Chicken Road.',
                    'How does the ₹5,000 maximum demo credit cap protect players?',
                    'Give me 3 tips for timing cash-outs in Aviator.',
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="w-full text-left p-2 rounded-lg bg-[#121622] hover:bg-[#1a2232] border border-[#242c3d] text-[11px] text-gray-300 transition-colors"
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Interface */}
          <div className="lg:col-span-8 flex flex-col h-[580px] bg-[#0e121a] border border-[#242c3d] rounded-2xl shadow-xl overflow-hidden">
            {/* Chat Thread Header */}
            <div className="p-3.5 px-5 border-b border-[#242c3d] bg-[#121622] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f5d061] to-[#8c7322] flex items-center justify-center text-black font-bold">
                  B
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">BITORA VIP Concierge Thread</h4>
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Model: {modelChoice}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Messages Window */}
            <div ref={chatScrollRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#f5d061] shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black font-medium shadow-md'
                        : 'bg-[#121622] border border-[#242c3d] text-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <span
                      className={`text-[9px] font-mono-numbers block mt-1.5 ${
                        m.role === 'user' ? 'text-black/60 text-right' : 'text-gray-500'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-[#242c3d] flex items-center justify-center text-gray-300 shrink-0 mt-0.5">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 items-center text-xs text-gray-400">
                  <div className="w-7 h-7 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#f5d061] shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-[#121622] border border-[#242c3d] rounded-2xl px-4 py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#f5d061] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#f5d061] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#f5d061] animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] text-gray-400 ml-1">Formulating VIP Strategy...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#121622] border-t border-[#242c3d]">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask the VIP Concierge about game odds, strategies, or rules..."
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  className="flex-1 bg-[#0a0d14] border border-[#242c3d] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isChatLoading}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] text-black font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: High-Quality Image Generator (gemini-3-pro-image-preview with 1K, 2K, 4K) */}
      {activeSubTab === 'art_studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[#242c3d] pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#d4af37]" />
                  Art Generator Configuration
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f5d061]">
                  gemini-3-pro-image-preview
                </span>
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Bespoke Design Prompt:
                </label>
                <textarea
                  rows={3}
                  value={artPrompt}
                  onChange={e => setArtPrompt(e.target.value)}
                  placeholder="Describe your luxury VIP card, token, or avatar..."
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#d4af37] resize-none"
                />
              </div>

              {/* Image Size Affordance: 1K, 2K, 4K (Mandatory feature) */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Image Resolution Affordance (1K, 2K, 4K):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1K', '2K', '4K'] as const).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setImageSize(size)}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                        imageSize === size
                          ? 'bg-[#d4af37]/25 text-[#f5d061] border-[#f5d061] shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                          : 'bg-[#121622] border-[#242c3d] text-gray-400 hover:text-white'
                      }`}
                    >
                      {size} Ultra
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Aspect Ratio:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1:1', '16:9', '9:16'] as const).map(ratio => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-[#d4af37]/25 text-[#f5d061] border-[#f5d061]'
                          : 'bg-[#121622] border-[#242c3d] text-gray-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Prompt Presets */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Preset VIP Themes:
                </span>
                <div className="space-y-1">
                  {PRESET_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setArtPrompt(p)}
                      className="w-full text-left p-1.5 rounded-lg bg-[#121622] hover:bg-[#1a2232] text-[10px] text-gray-300 truncate"
                    >
                      &bull; {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !artPrompt.trim()}
                className="w-full py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Rendering {imageSize} Artwork...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Generate High-Quality {imageSize} Art</span>
                  </>
                )}
              </button>

              {imageError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Artwork Showcase Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[460px] text-center">
              {isGeneratingImage ? (
                <div className="space-y-4 animate-pulse">
                  <div className="w-64 h-64 rounded-2xl bg-[#121622] border border-[#d4af37]/30 flex flex-col items-center justify-center p-6 text-center">
                    <RefreshCw className="w-8 h-8 text-[#d4af37] animate-spin mb-3" />
                    <p className="text-xs font-bold text-white">Rendering {imageSize} Masterpiece</p>
                    <p className="text-[10px] text-gray-500 mt-1">Applying gold leaf, lighting shaders, and VIP specular reflections...</p>
                  </div>
                </div>
              ) : generatedImage ? (
                <div className="space-y-4 w-full flex flex-col items-center">
                  <div className="relative group max-w-md w-full">
                    <img
                      src={generatedImage}
                      alt="Generated Artwork"
                      className="w-full rounded-2xl border-2 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.35)] object-contain max-h-[380px] bg-black"
                    />
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/80 border border-[#d4af37]/50 text-[#f5d061]">
                      {imageSize} RESOLUTION
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 max-w-md italic">{imageCaption}</p>

                  {/* Actions: Set as Avatar or Download */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        updateProfile({ avatar: generatedImage });
                        setImageCaption('✓ Avatar updated with your bespoke generated artwork!');
                      }}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:shadow-lg"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      Set as VIP Avatar
                    </button>

                    <a
                      href={generatedImage}
                      download={`BITORA-VIP-${imageSize}.png`}
                      className="py-2 px-3 rounded-xl bg-[#151b26] border border-[#242c3d] hover:border-[#d4af37]/40 text-gray-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download {imageSize} Image
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#121622] border border-[#242c3d] flex items-center justify-center mx-auto text-gray-500">
                    <Layers className="w-8 h-8 text-[#d4af37]/50" />
                  </div>
                  <div>
                    <h4 className="font-cinzel text-base font-bold text-white">
                      No Artwork Rendered Yet
                    </h4>
                    <p className="text-xs text-gray-400 max-w-sm mt-1">
                      Choose your prompt, specify resolution (1K, 2K, or 4K), and click Generate to create luxury tokens, cards, and avatars.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

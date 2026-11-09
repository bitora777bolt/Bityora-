import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Dev server must strictly run on port 3000 as per environment constraints
const PORT = 3000;

// Enable raw body capture on express.json for cryptographic webhook signature verification
app.use(
  express.json({
    limit: '15mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Initialize GoogleGenAI SDK with required telemetry headers
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// VIP Casino Concierge Chat API (Gemini Multi-Turn)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, modelChoice = 'gemini-3.8-flash' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    if (!apiKey) {
      return res.status(200).json({
        reply: "Greetings from the BITORA VIP Concierge! I am operating in offline advisory mode. You can test all 3 demo games (Mines 24x24, Chicken Road, and Aviator), manage virtual credits up to ₹5,000, and explore the admin dashboard anytime."
      });
    }

    // Format history for Gemini SDK
    // System instruction gives persona as the BITORA VIP Advisor
    const systemInstruction = 
      "You are the BITORA VIP Casino Concierge & Gaming Advisor. BITORA is an ultra-luxury black-and-gold casino simulation platform. " +
      "Rules to follow:\n" +
      "1. You assist players with strategies and rules for the 5 demo games: 24x24 Mines (3-15 mines), Royal Fortune Wheel (invest points & get 2 more points, min bet 20, big bet 100), Diamond Vault Puzzle (gem cipher matching, min bet 20, big bet 100), Chicken Road (step multiplier), and Aviator flight simulator.\n" +
      "2. Emphasize that all credits are 100% DEMO CREDITS (Virtual Credits) with zero real-money value.\n" +
      "3. Virtual credit limits: Minimum top-up is ₹100, maximum demo balance is strictly ₹5,000.\n" +
      "4. Be courteous, highly sophisticated, articulate, and maintain a VIP high-roller aesthetic.\n" +
      "5. Promote responsible simulated gaming. Provide clear step-by-step game mechanics when asked.";

    // Format contents
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Selected model (defaults to gemini-3.8-flash, or gemini-3.1-flash-lite / gemini-4-argon)
    const validModel = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'].includes(modelChoice)
      ? modelChoice
      : 'gemini-3.8-flash';

    const response = await ai.models.generateContent({
      model: validModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I am at your service, esteemed guest of BITORA.";
    return res.json({ reply });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate response from VIP Concierge.'
    });
  }
});

// Image Generation API using gemini-3-pro-image-preview (with 1K, 2K, 4K resolution)
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, imageSize = '1K', aspectRatio = '1:1' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured in the environment.'
      });
    }

    // Call gemini-3-pro-image-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `High luxury black and gold casino VIP art: ${prompt}. Ultra-detailed, 8K render, dramatic cinematic lighting, gold foil reflection, onyx marble background, opulent aesthetic.`
          }
        ]
      },
      config: {
        // @ts-ignore
        imageConfig: {
          aspectRatio: aspectRatio || '1:1',
          imageSize: imageSize || '1K'
        }
      }
    });

    let imageUrl = '';
    let caption = '';

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          caption += part.text;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        error: 'No image data returned from image generation model.'
      });
    }

    return res.json({ imageUrl, caption });
  } catch (error: any) {
    console.error('Image Generation API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate VIP artwork.'
    });
  }
});

// ==========================================
// MANUAL UPI DEPOSIT & ADMINISTRATIVE VERIFICATION SYSTEM
// 3 EXPLICIT PAYMENT OPTIONS: Google Pay, PhonePe, Paytm
// ==========================================

type PaymentMethodType = 'gpay' | 'phonepe' | 'paytm';

interface MethodQrConfig {
  id: PaymentMethodType;
  name: string;
  qrImageUrl: string;
  upiId: string;
  payeeName: string;
  instructions: string;
  badge: string;
  themeColor: string;
  accentColor: string;
  updatedAt: string;
  updatedBy: string;
}

interface ServerDepositRequest {
  id: string;
  userId: string;
  playerId: string;
  username: string;
  userEmail?: string;
  paymentMethod: PaymentMethodType;
  paymentMethodName: string;
  amount: number;
  utr: string;
  screenshotUrl: string;
  screenshotName?: string;
  screenshotSize?: string;
  qrUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  processedAt?: string;
  rejectionReason?: string;
  adminId?: string;
  adminNote?: string;
}

// In-memory persistent stores with 3 default payment methods
const paymentMethodConfigs: Record<PaymentMethodType, MethodQrConfig> = {
  gpay: {
    id: 'gpay',
    name: 'Google Pay',
    qrImageUrl:
      'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dbitora.gpay%40okaxis%26pn%3DBitora%2520VIP%2520GooglePay%26cu%3DINR',
    upiId: 'bitora.gpay@okaxis',
    payeeName: 'Bitora VIP (Google Pay)',
    instructions:
      'Open Google Pay, tap "Scan any QR code", point camera at this code, verify Payee "Bitora VIP (Google Pay)", complete payment, and paste your 12-digit UTR below.',
    badge: 'GPay Instant',
    themeColor: 'from-[#4285F4] via-[#34A853] to-[#FBBC05]',
    accentColor: '#4285F4',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SYSTEM_ADMIN',
  },
  phonepe: {
    id: 'phonepe',
    name: 'PhonePe',
    qrImageUrl:
      'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dbitora.phonepe%40ybl%26pn%3DBitora%2520VIP%2520PhonePe%26cu%3DINR',
    upiId: 'bitora.phonepe@ybl',
    payeeName: 'Bitora VIP (PhonePe)',
    instructions:
      'Open PhonePe, tap the QR scanner icon on top right, scan this code, verify Payee "Bitora VIP (PhonePe)", transfer exact amount, and submit your 12-digit UTR with screenshot.',
    badge: 'PhonePe Direct',
    themeColor: 'from-[#5f259f] to-[#3f1070]',
    accentColor: '#6739B7',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SYSTEM_ADMIN',
  },
  paytm: {
    id: 'paytm',
    name: 'Paytm',
    qrImageUrl:
      'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dbitora.paytm%40paytm%26pn%3DBitora%2520VIP%2520Paytm%26cu%3DINR',
    upiId: 'bitora.paytm@paytm',
    payeeName: 'Bitora VIP (Paytm)',
    instructions:
      'Open Paytm, tap "Scan Any QR", scan this code, verify Payee "Bitora VIP (Paytm)", complete payment from Bank or Paytm UPI, and copy your 12-digit UPI reference ID below.',
    badge: 'Paytm UPI / Wallet',
    themeColor: 'from-[#00b9f1] to-[#002e6e]',
    accentColor: '#00BAF2',
    updatedAt: new Date().toISOString(),
    updatedBy: 'SYSTEM_ADMIN',
  },
};

const serverDepositRequests: ServerDepositRequest[] = [
  {
    id: 'DEP-884912',
    userId: 'BIT-782914',
    playerId: 'BTY-GAME-782914',
    username: 'Aarav Royal',
    userEmail: 'aarav.vip@bitora.demo',
    paymentMethod: 'phonepe',
    paymentMethodName: 'PhonePe',
    amount: 1000,
    utr: '419283746501',
    screenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    screenshotName: 'phonepe_payment_1000.jpg',
    screenshotSize: '342 KB',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 3600000 * 4).toLocaleString('en-IN'),
    processedAt: new Date(Date.now() - 3600000 * 3.8).toLocaleString('en-IN'),
    adminId: 'ADM-BITORA-01',
    adminNote: 'UTR verified against PhonePe Merchant statement.',
  },
  {
    id: 'DEP-991204',
    userId: 'BIT-990142',
    playerId: 'BTY-GAME-990142',
    username: 'Priya Mehta',
    userEmail: 'priya.m@bitora.demo',
    paymentMethod: 'gpay',
    paymentMethodName: 'Google Pay',
    amount: 500,
    utr: '420198347112',
    screenshotUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80',
    screenshotName: 'gpay_receipt_500.png',
    screenshotSize: '512 KB',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 1800000).toLocaleString('en-IN'),
  },
];

// 1. Get Static UPI QR Code Configuration for All 3 Payment Methods
app.get('/api/deposit/config', (_req, res) => {
  return res.json({
    success: true,
    methods: paymentMethodConfigs,
    config: paymentMethodConfigs.gpay, // backward compatibility
    minDeposit: 110,
    maxDeposit: 5000,
    currency: 'INR',
  });
});

// 2. Update Static UPI QR Code Configuration for a Specific Method (Admin-Only)
app.post('/api/deposit/config', (req, res) => {
  try {
    const { method = 'gpay', qrImageUrl, upiId, payeeName, instructions, adminRole, adminId, adminEmail } = req.body;

    const isHardcodedAdmin = adminEmail && String(adminEmail).trim().toLowerCase() === 'jatinrathodeklo@gmail.com';

    // Strict Role-Based Access Control: Exclusively administrator or hardcoded admin email
    if (adminRole !== 'admin' && !isHardcodedAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authorized administrators are permitted to configure payment method QR codes.',
      });
    }

    const targetMethodKey: PaymentMethodType =
      method === 'phonepe' || method === 'paytm' ? method : 'gpay';
    const targetConfig = paymentMethodConfigs[targetMethodKey];

    if (qrImageUrl !== undefined && qrImageUrl !== null) {
      targetConfig.qrImageUrl = String(qrImageUrl).trim();
    }
    if (upiId) targetConfig.upiId = String(upiId).trim();
    if (payeeName) targetConfig.payeeName = String(payeeName).trim();
    if (instructions) targetConfig.instructions = String(instructions).trim();

    targetConfig.updatedAt = new Date().toISOString();
    targetConfig.updatedBy = adminId || 'ADM-BITORA-01';

    console.log(`[Admin] Static deposit QR code for ${targetConfig.name} updated by ${targetConfig.updatedBy}`);

    return res.json({
      success: true,
      message: `Static QR code and settings for ${targetConfig.name} updated successfully by administrator.`,
      config: targetConfig,
      methods: paymentMethodConfigs,
    });
  } catch (error: any) {
    console.error('[Admin] QR Config Update Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update QR configuration.' });
  }
});

// 3. Submit Manual Deposit Request (Player Flow)
app.post('/api/deposit/submit', (req, res) => {
  try {
    const {
      userId,
      playerId,
      username,
      userEmail,
      paymentMethod = 'gpay',
      amount,
      utr,
      screenshotUrl,
      screenshotName,
      screenshotSize,
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount < 10) {
      return res.status(400).json({ error: 'Valid deposit amount (min ₹10) is required.' });
    }

    if (!utr || String(utr).trim().length < 6) {
      return res.status(400).json({ error: 'Valid 12-digit UTR / Transaction ID is required.' });
    }

    const cleanUtr = String(utr).trim();

    // Check for duplicate UTR submissions
    const existing = serverDepositRequests.find(
      r => r.utr.toLowerCase() === cleanUtr.toLowerCase() && r.status !== 'REJECTED'
    );
    if (existing) {
      return res.status(409).json({
        error: `UTR ${cleanUtr} has already been submitted under request ${existing.id} (Status: ${existing.status}). Please check your transaction reference.`,
      });
    }

    const validMethod: PaymentMethodType =
      paymentMethod === 'phonepe' || paymentMethod === 'paytm' ? paymentMethod : 'gpay';
    const methodInfo = paymentMethodConfigs[validMethod];

    const newRequest: ServerDepositRequest = {
      id: `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: userId || 'GUEST',
      playerId: playerId || userId || `BIT-${Date.now().toString().slice(-6)}`,
      username: username || 'Player',
      userEmail: userEmail || '',
      paymentMethod: validMethod,
      paymentMethodName: methodInfo.name,
      amount: numAmount,
      utr: cleanUtr,
      screenshotUrl: screenshotUrl || '',
      screenshotName: screenshotName || 'payment_proof.jpg',
      screenshotSize: screenshotSize || '120 KB',
      qrUrl: methodInfo.qrImageUrl,
      status: 'PENDING',
      createdAt: new Date().toLocaleString('en-IN'),
    };

    serverDepositRequests.unshift(newRequest);
    if (serverDepositRequests.length > 200) serverDepositRequests.pop();

    console.log(
      `[Deposit] New deposit request: ${newRequest.id} via ${newRequest.paymentMethodName} by ${newRequest.username} (Player ID: ${newRequest.playerId}, Amount: ₹${newRequest.amount}, UTR: ${newRequest.utr})`
    );

    return res.status(201).json({
      success: true,
      message: `Deposit request via ${newRequest.paymentMethodName} submitted successfully! Administrator review is pending.`,
      request: newRequest,
    });
  } catch (error: any) {
    console.error('[Deposit] Submit Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit deposit request.' });
  }
});

// 4. Get All Deposit Requests (Admin & User filter)
app.get('/api/deposit/requests', (req, res) => {
  const { userId, role } = req.query;

  if (role === 'admin') {
    return res.json({
      success: true,
      requests: serverDepositRequests,
      pendingCount: serverDepositRequests.filter(r => r.status === 'PENDING').length,
    });
  }

  if (userId) {
    const userReqs = serverDepositRequests.filter(r => r.userId === userId || r.playerId === userId);
    return res.json({
      success: true,
      requests: userReqs,
    });
  }

  return res.json({
    success: true,
    requests: serverDepositRequests.slice(0, 50),
    pendingCount: serverDepositRequests.filter(r => r.status === 'PENDING').length,
  });
});

// 5. Review & Process Deposit Request (Admin Only)
app.post('/api/deposit/review', (req, res) => {
  try {
    const { requestId, action, adminRole, adminId, reason } = req.body;

    if (adminRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authorized administrators can review and approve deposit requests.',
      });
    }

    const request = serverDepositRequests.find(r => r.id === requestId);
    if (!request) {
      return res.status(404).json({ error: `Deposit request ${requestId} not found.` });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        error: `Deposit request ${requestId} has already been processed with status: ${request.status}.`,
      });
    }

    request.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    request.processedAt = new Date().toLocaleString('en-IN');
    request.adminId = adminId || 'ADM-BITORA-01';
    if (action === 'REJECT') {
      request.rejectionReason = reason || 'Declined during manual supervisor audit.';
    } else {
      request.adminNote = reason || 'Verified against bank transaction feed.';
    }

    console.log(`[Admin] Deposit request ${requestId} ${request.status} by ${request.adminId}`);

    return res.json({
      success: true,
      message: `Deposit request ${requestId} has been ${request.status} successfully.`,
      request,
    });
  } catch (error: any) {
    console.error('[Admin] Review Deposit Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to review deposit request.' });
  }
});

// Server status & platform configs
app.get('/api/config', (_req, res) => {
  res.json({
    appName: 'BITORA',
    minDeposit: 100,
    maxBalance: 5000,
    currency: 'INR',
    currencySymbol: '₹',
    currencyName: 'Rupees',
    disclaimer: 'Purely virtual credit entertainment. No real-money gambling or payouts.',
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[BITORA Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

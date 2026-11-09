import { DepositRequest, PaymentMethodType, PaymentMethodConfig } from '../types';

export interface DepositQrConfig {
  qrImageUrl: string;
  upiId: string;
  payeeName: string;
  instructions: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PAYMENT_METHOD_CONFIGS: Record<PaymentMethodType, PaymentMethodConfig> = {
  gpay: {
    id: 'gpay',
    name: 'Google Pay',
    qrImageUrl:
      'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dbitora.gpay%40okaxis%26pn%3DBitora%2520VIP%2520GooglePay%26cu%3DINR',
    upiId: 'bitora.gpay@okaxis',
    payeeName: 'Bitora VIP (Google Pay)',
    instructions:
      'Open Google Pay, tap "Scan any QR code", point your camera at this code, verify Payee "Bitora VIP (Google Pay)", complete payment, and paste your 12-digit UTR below.',
    badge: 'GPay Instant',
    themeColor: 'from-[#4285F4] via-[#34A853] to-[#FBBC05]',
    accentColor: '#4285F4',
  },
  phonepe: {
    id: 'phonepe',
    name: 'PhonePe',
    qrImageUrl:
      'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dbitora.phonepe%40ybl%26pn%3DBitora%2520VIP%2520PhonePe%26cu%3DINR',
    upiId: 'bitora.phonepe@ybl',
    payeeName: 'Bitora VIP (PhonePe)',
    instructions:
      'Open PhonePe, tap the QR scanner icon on the top right, scan this code, verify Payee "Bitora VIP (PhonePe)", transfer exact amount, and submit your 12-digit UTR with screenshot.',
    badge: 'PhonePe Direct',
    themeColor: 'from-[#5f259f] to-[#3f1070]',
    accentColor: '#6739B7',
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
  },
};

export const DEFAULT_DEPOSIT_QR_CONFIG: DepositQrConfig = {
  qrImageUrl: DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.qrImageUrl,
  upiId: DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.upiId,
  payeeName: DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.payeeName,
  instructions: DEFAULT_PAYMENT_METHOD_CONFIGS.gpay.instructions,
};

/**
 * Fetch all three payment method configs (Google Pay, PhonePe, Paytm) from server or local fallback
 */
export async function fetchAllPaymentMethodConfigs(): Promise<Record<PaymentMethodType, PaymentMethodConfig>> {
  try {
    const res = await fetch('/api/deposit/config');
    if (res.ok) {
      const data = await res.json();
      if (data.methods) {
        return {
          ...DEFAULT_PAYMENT_METHOD_CONFIGS,
          ...data.methods,
        };
      }
    }
  } catch (err) {
    console.warn('Could not fetch deposit configs from server, checking local storage:', err);
  }

  // Local storage fallback
  try {
    const saved = localStorage.getItem('bitora_payment_methods_config');
    if (saved) {
      return {
        ...DEFAULT_PAYMENT_METHOD_CONFIGS,
        ...JSON.parse(saved),
      };
    }
  } catch {}

  return DEFAULT_PAYMENT_METHOD_CONFIGS;
}

/**
 * Fetch static UPI QR configuration (backward compatible single object)
 */
export async function fetchDepositQrConfig(): Promise<DepositQrConfig> {
  const configs = await fetchAllPaymentMethodConfigs();
  return {
    qrImageUrl: configs.gpay.qrImageUrl,
    upiId: configs.gpay.upiId,
    payeeName: configs.gpay.payeeName,
    instructions: configs.gpay.instructions,
  };
}

/**
 * Update a specific payment method's static QR code configuration (Administrator Only)
 */
export async function updatePaymentMethodQrConfig(
  method: PaymentMethodType,
  config: Partial<PaymentMethodConfig>,
  adminRole: string,
  adminId: string,
  adminEmail?: string
): Promise<{ success: boolean; message: string; config?: PaymentMethodConfig }> {
  const isHardcodedAdmin = adminEmail && adminEmail.trim().toLowerCase() === 'jatinrathodeklo@gmail.com';
  if (adminRole !== 'admin' && !isHardcodedAdmin) {
    return {
      success: false,
      message: 'Unauthorized: Only administrators are permitted to configure payment method QR codes.',
    };
  }

  try {
    const res = await fetch('/api/deposit/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method,
        ...config,
        adminRole: isHardcodedAdmin ? 'admin' : adminRole,
        adminId,
        adminEmail,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      // Save locally
      try {
        const saved = localStorage.getItem('bitora_payment_methods_config');
        const current = saved ? JSON.parse(saved) : { ...DEFAULT_PAYMENT_METHOD_CONFIGS };
        current[method] = { ...current[method], ...data.config };
        localStorage.setItem('bitora_payment_methods_config', JSON.stringify(current));
      } catch {}

      return { success: true, message: data.message, config: data.config };
    }
    return { success: false, message: data.error || 'Failed to update payment method QR configuration.' };
  } catch (err: any) {
    // Save to local storage if offline
    try {
      const saved = localStorage.getItem('bitora_payment_methods_config');
      const current = saved ? JSON.parse(saved) : { ...DEFAULT_PAYMENT_METHOD_CONFIGS };
      current[method] = {
        ...current[method],
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: adminId,
      };
      localStorage.setItem('bitora_payment_methods_config', JSON.stringify(current));
      return {
        success: true,
        message: `${DEFAULT_PAYMENT_METHOD_CONFIGS[method].name} QR configuration updated in local storage.`,
        config: current[method],
      };
    } catch {}

    return { success: false, message: 'Could not save payment method QR config.' };
  }
}

/**
 * Legacy update handler (updates gpay or all)
 */
export async function updateDepositQrConfig(
  config: Partial<DepositQrConfig>,
  adminRole: string,
  adminId: string
): Promise<{ success: boolean; message: string; config?: DepositQrConfig }> {
  const res = await updatePaymentMethodQrConfig('gpay', config, adminRole, adminId);
  return {
    success: res.success,
    message: res.message,
    config: res.config ? {
      qrImageUrl: res.config.qrImageUrl,
      upiId: res.config.upiId,
      payeeName: res.config.payeeName,
      instructions: res.config.instructions,
    } : undefined,
  };
}

/**
 * Submit manual deposit request with Player ID, payment method, amount, UTR, and payment screenshot
 */
export async function submitDepositRequestApi(payload: {
  userId: string;
  playerId: string;
  username: string;
  userEmail?: string;
  paymentMethod?: PaymentMethodType;
  paymentMethodName?: string;
  amount: number;
  utr: string;
  screenshotUrl: string;
  screenshotName?: string;
  screenshotSize?: string;
}): Promise<{ success: boolean; message: string; request?: DepositRequest }> {
  try {
    const res = await fetch('/api/deposit/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: data.message, request: data.request };
    }
    return { success: false, message: data.error || 'Failed to submit deposit request.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error while submitting deposit.' };
  }
}

/**
 * Fetch deposit requests from server
 */
export async function fetchDepositRequestsApi(role?: string, userId?: string): Promise<DepositRequest[]> {
  try {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (userId) params.set('userId', userId);

    const res = await fetch(`/api/deposit/requests?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data.requests || [];
    }
  } catch {}
  return [];
}

/**
 * Admin review & credit handler
 */
export async function reviewDepositRequestApi(payload: {
  requestId: string;
  action: 'APPROVE' | 'REJECT';
  adminRole: string;
  adminId: string;
  reason?: string;
}): Promise<{ success: boolean; message: string; request?: DepositRequest }> {
  try {
    const res = await fetch('/api/deposit/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: data.message, request: data.request };
    }
    return { success: false, message: data.error || 'Failed to process deposit review.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error processing review.' };
  }
}

// Client-Side Razorpay Payment Gateway Utility
// Handles script loading, order initiation, checkout popup, and verification

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayOrderResponse {
  success: boolean;
  order: {
    id: string;
    amount: number; // in paise
    currency: string;
    receipt: string;
    status: string;
  };
  keyId: string;
  error?: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  message: string;
  orderId: string;
  paymentId: string;
  amount: number;
  userId: string;
  credited: boolean;
  error?: string;
}

/**
 * Dynamically loads the official Razorpay Checkout SDK script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }

    if (window.Razorpay) {
      return resolve(true);
    }

    const existingScript = document.getElementById('razorpay-checkout-script');
    if (existingScript) {
      return resolve(true);
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout script from CDN.');
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Creates an order via backend server endpoint /api/razorpay/create-order
 */
export const createRazorpayOrder = async (
  amount: number,
  userId: string,
  userEmail?: string,
  userPhone?: string
): Promise<RazorpayOrderResponse> => {
  const res = await fetch('/api/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      userId,
      userEmail,
      userPhone,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create Razorpay order.');
  }

  return res.json();
};

/**
 * Verifies the payment with the backend HMAC SHA-256 signature verifier
 */
export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  amount: number;
  userId: string;
}): Promise<RazorpayVerifyResponse> => {
  const res = await fetch('/api/razorpay/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Payment signature verification failed.');
  }

  return data;
};

/**
 * Simulates a Razorpay Webhook event for end-to-end webhook validation
 */
export const simulateRazorpayWebhook = async (
  orderId: string,
  paymentId: string,
  amount: number,
  userId: string
) => {
  const res = await fetch('/api/razorpay/simulate-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      paymentId,
      amount,
      userId,
    }),
  });

  return res.json();
};

/**
 * Fetches Razorpay configuration and environment status
 */
export const fetchRazorpayConfig = async () => {
  const res = await fetch('/api/razorpay/config');
  return res.json();
};

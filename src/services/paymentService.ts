import { Bank, PaymentRequest, PaymentResult, Wallet } from '../types';

/*
 * MOCK PAYMENT SERVICE
 * ---------------------------------------------------------------------------
 * In production, do NOT send raw card numbers / CVV to your own backend.
 * Use a payment gateway SDK (e.g. Razorpay, Stripe, PayU, Cashfree), which
 * collects card details in its own secure form, returns a token, and handles
 * wallet / net-banking redirects. Your backend then confirms the payment with
 * the gateway and updates the card balances. This keeps you out of PCI-DSS scope.
 */

export const WALLETS: Wallet[] = [
  { id: 'paytm', name: 'Paytm Wallet', balance: 25000 },
  { id: 'phonepe', name: 'PhonePe Wallet', balance: 8200 },
  { id: 'amazonpay', name: 'Amazon Pay Balance', balance: 3150 },
  { id: 'mobikwik', name: 'MobiKwik Wallet', balance: 60000 },
];

export const BANKS: Bank[] = [
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra Bank' },
  { id: 'pnb', name: 'Punjab National Bank' },
  { id: 'bob', name: 'Bank of Baroda' },
  { id: 'canara', name: 'Canara Bank' },
  { id: 'union', name: 'Union Bank of India' },
  { id: 'indusind', name: 'IndusInd Bank' },
  { id: 'yes', name: 'Yes Bank' },
  { id: 'idfc', name: 'IDFC FIRST Bank' },
];

function generateTransactionId(): string {
  const random = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `TXN${Date.now().toString().slice(-8)}${random}`;
}

export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  // Simulate network + bank processing time.
  await new Promise((resolve) => setTimeout(resolve, 1800));

  if (request.total <= 0 || request.allocations.length === 0) {
    return { success: false, transactionId: '', paidAt: '', message: 'Nothing to pay.' };
  }

  return {
    success: true,
    transactionId: generateTransactionId(),
    paidAt: new Date().toISOString(),
  };
}

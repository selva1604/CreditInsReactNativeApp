export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'RUPAY';

export interface CreditCard {
  id: string;
  bankName: string;
  cardName: string;
  last4: string;
  holderName: string;
  network: CardNetwork;
  creditLimit: number;
  /** Total amount currently owed on the card */
  outstanding: number;
  /** Minimum amount that must be paid by the due date */
  minimumDue: number;
  /** ISO date string (YYYY-MM-DD) */
  dueDate: string;
  /** ISO date string (YYYY-MM-DD) */
  statementDate: string;
  rewardPoints: number;
  /** How many reward points this card earns when a payment is made */
  rewardRule: RewardRule;
  /** Gradient colours for the card face */
  gradient: readonly [string, string];
}

export type DueStatus = 'paid' | 'overdue' | 'due-soon' | 'upcoming';

// ---------- Insurance ----------

export type InsuranceType = 'health' | 'vehicle';

export interface InsuranceProvider {
  id: string;
  name: string;
  /** Short line shown under the name */
  description: string;
  /** Background colour of the initials logo */
  color: string;
}

// ---------- Rewards ----------

export interface RewardRule {
  /** Points earned for every ₹100 paid */
  pointsPer100: number;
  /** Bonus when at least the minimum due is paid on or before the due date */
  onTimeBonus: number;
  /** Bonus when the full outstanding amount is paid */
  fullPaymentBonus: number;
}

export interface RewardBreakdown {
  base: number;
  onTimeBonus: number;
  fullPaymentBonus: number;
  total: number;
}

// ---------- Payments ----------

export type PaymentMethod = 'wallet' | 'netbanking' | 'card';

/** What the user wants to pay: one card, or every card with a balance. */
export type PaymentScope = { type: 'single'; cardId: string } | { type: 'all' };

export type AmountOption = 'minimum' | 'total' | 'custom';

export interface PaymentAllocation {
  cardId: string;
  amount: number;
}

export interface PaymentRequest {
  allocations: PaymentAllocation[];
  total: number;
  method: PaymentMethod;
  /** Human-readable description, e.g. "Paytm Wallet" or "Debit card •••• 1111". Never the full card number. */
  methodLabel: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  paidAt: string;
  message?: string;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
}

export interface Bank {
  id: string;
  name: string;
}

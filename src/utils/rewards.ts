import { CreditCard, RewardBreakdown, RewardRule } from '../types';
import { daysUntil, formatNumber } from './format';

/**
 * Calculates the reward points earned for paying `amount` towards `card`.
 * `card` must be the card's state BEFORE the payment is applied.
 *
 * Rules:
 *  - Base:         rule.pointsPer100 points for every full ₹100 paid.
 *  - On-time:      paying at least the minimum due on/before the due date.
 *                  Only given while a minimum due is pending, so it can be earned once per bill.
 *  - Full payment: paying the entire outstanding amount. Once outstanding is 0 it can't repeat.
 *
 * NOTE: In production, calculate and credit points on your backend (after the payment
 * gateway confirms the payment) so users can't change them from the app.
 */
export function calculatePaymentRewards(card: CreditCard, amount: number): RewardBreakdown {
  const rule = card.rewardRule;
  if (amount <= 0) return { base: 0, onTimeBonus: 0, fullPaymentBonus: 0, total: 0 };

  const base = Math.floor(amount / 100) * rule.pointsPer100;

  const isOnTime = daysUntil(card.dueDate) >= 0;
  const coversMinimum = card.minimumDue > 0 && amount >= card.minimumDue;
  const onTimeBonus = isOnTime && coversMinimum ? rule.onTimeBonus : 0;

  const fullPaymentBonus = card.outstanding > 0 && amount >= card.outstanding ? rule.fullPaymentBonus : 0;

  return { base, onTimeBonus, fullPaymentBonus, total: base + onTimeBonus + fullPaymentBonus };
}

export function describeRewardRule(rule: RewardRule): string {
  return (
    `${rule.pointsPer100} pts per ₹100 paid · ` +
    `+${formatNumber(rule.onTimeBonus)} on-time · ` +
    `+${formatNumber(rule.fullPaymentBonus)} full payment`
  );
}

export function describeBreakdown(r: RewardBreakdown): string {
  const parts = [`Base ${formatNumber(r.base)}`];
  if (r.onTimeBonus) parts.push(`On-time +${formatNumber(r.onTimeBonus)}`);
  if (r.fullPaymentBonus) parts.push(`Full payment +${formatNumber(r.fullPaymentBonus)}`);
  return parts.join(' · ');
}

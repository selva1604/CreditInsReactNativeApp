import { CreditCard, PaymentAllocation } from '../types';
import { getMockCards } from '../data/mockCards';
import { calculatePaymentRewards } from '../utils/rewards';

/**
 * Replace this with a real API call, e.g.
 *   const res = await fetch('https://api.example.com/cards', { headers: { Authorization: `Bearer ${token}` } });
 *   return (await res.json()) as CreditCard[];
 */
export async function loadCards(): Promise<CreditCard[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return getMockCards();
}

/** Returns a new card list with the paid amounts deducted and reward points added. */
export function applyPayments(cards: CreditCard[], allocations: PaymentAllocation[]): CreditCard[] {
  return cards.map((card) => {
    const paid = allocations
      .filter((a) => a.cardId === card.id)
      .reduce((sum, a) => sum + a.amount, 0);
    if (paid <= 0) return card;
    // Rewards are calculated on the card's state before the payment.
    const earned = calculatePaymentRewards(card, paid).total;
    return {
      ...card,
      outstanding: Math.max(card.outstanding - paid, 0),
      minimumDue: Math.max(card.minimumDue - paid, 0),
      rewardPoints: card.rewardPoints + earned,
    };
  });
}

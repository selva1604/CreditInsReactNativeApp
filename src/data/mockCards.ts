import { CreditCard } from '../types';
import { toISODate } from '../utils/format';

function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/**
 * Sample data. Dates are generated relative to today so the dashboard
 * always shows a realistic mix of overdue / due-soon / upcoming cards.
 * Replace this with an API call (see DashboardScreen `loadCards`).
 */
export function getMockCards(): CreditCard[] {
  return [
    {
      id: 'card-1',
      bankName: 'HDFC Bank',
      cardName: 'Regalia Gold',
      last4: '4821',
      holderName: 'A. KUMAR',
      network: 'VISA',
      creditLimit: 300000,
      outstanding: 48250,
      minimumDue: 2415,
      dueDate: daysFromToday(3),
      statementDate: daysFromToday(-17),
      rewardPoints: 12450,
      rewardRule: { pointsPer100: 4, onTimeBonus: 100, fullPaymentBonus: 250 },
      gradient: ['#1E3A8A', '#3B82F6'],
    },
    {
      id: 'card-2',
      bankName: 'ICICI Bank',
      cardName: 'Amazon Pay',
      last4: '7710',
      holderName: 'A. KUMAR',
      network: 'MASTERCARD',
      creditLimit: 150000,
      outstanding: 18990,
      minimumDue: 950,
      dueDate: daysFromToday(12),
      statementDate: daysFromToday(-8),
      rewardPoints: 3820,
      rewardRule: { pointsPer100: 2, onTimeBonus: 50, fullPaymentBonus: 100 },
      gradient: ['#7C2D12', '#F97316'],
    },
    {
      id: 'card-3',
      bankName: 'SBI Card',
      cardName: 'SimplyCLICK',
      last4: '3302',
      holderName: 'A. KUMAR',
      network: 'RUPAY',
      creditLimit: 100000,
      outstanding: 72400,
      minimumDue: 3620,
      dueDate: daysFromToday(-2),
      statementDate: daysFromToday(-22),
      rewardPoints: 6105,
      rewardRule: { pointsPer100: 5, onTimeBonus: 150, fullPaymentBonus: 300 },
      gradient: ['#134E4A', '#14B8A6'],
    },
    {
      id: 'card-4',
      bankName: 'American Express',
      cardName: 'Platinum Travel',
      last4: '1009',
      holderName: 'A. KUMAR',
      network: 'AMEX',
      creditLimit: 500000,
      outstanding: 0,
      minimumDue: 0,
      dueDate: daysFromToday(20),
      statementDate: daysFromToday(0),
      rewardPoints: 28760,
      rewardRule: { pointsPer100: 3, onTimeBonus: 100, fullPaymentBonus: 500 },
      gradient: ['#111827', '#6B7280'],
    },
  ];
}

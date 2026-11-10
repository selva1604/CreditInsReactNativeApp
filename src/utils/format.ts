import { CreditCard, DueStatus } from '../types';

// Change these two values to switch currency / locale for the whole app.
const LOCALE = 'en-IN';
const CURRENCY = 'INR';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Parses YYYY-MM-DD as a local date (avoids UTC off-by-one issues). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso: string): string {
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Whole days from today until the given date (negative if in the past). */
export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseISODate(iso);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function getDueStatus(card: CreditCard): DueStatus {
  if (card.minimumDue <= 0) return 'paid';
  const days = daysUntil(card.dueDate);
  if (days < 0) return 'overdue';
  if (days <= 5) return 'due-soon';
  return 'upcoming';
}

export function describeDue(card: CreditCard): string {
  const status = getDueStatus(card);
  if (status === 'paid') return 'Paid';
  const days = daysUntil(card.dueDate);
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

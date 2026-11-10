import { CardNetwork } from '../types';

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** "4111111111111111" -> "4111 1111 1111 1111" */
export function formatCardNumber(input: string): string {
  return onlyDigits(input)
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

/** Standard Luhn checksum used by all major card networks. */
export function luhnCheck(cardNumber: string): boolean {
  const digits = onlyDigits(cardNumber);
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

export function detectNetwork(cardNumber: string): CardNetwork | null {
  const d = onlyDigits(cardNumber);
  if (/^3[47]/.test(d)) return 'AMEX';
  if (/^4/.test(d)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'MASTERCARD';
  if (/^(60|65|81|82|508)/.test(d)) return 'RUPAY';
  return null;
}

/** "1228" -> "12/28" */
export function formatExpiry(input: string): string {
  const d = onlyDigits(input).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function isExpiryValid(expiry: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const endOfExpiryMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfExpiryMonth >= new Date();
}

export function isCvvValid(cvv: string, network: CardNetwork | null): boolean {
  const length = network === 'AMEX' ? 4 : 3;
  return cvv.length === length && /^\d+$/.test(cvv);
}

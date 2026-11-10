import AsyncStorage from '@react-native-async-storage/async-storage';

/*
 * MOCK MOBILE-NUMBER (OTP) AUTH SERVICE
 * ---------------------------------------------------------------------------
 * This runs entirely on the device so the login flow can be built and tested
 * without a backend. The OTP is returned as `devOtp` and shown on screen.
 *
 * In production the OTP must be generated, sent and checked on a SERVER,
 * never in the app:
 *   requestOtp -> POST /auth/otp/request { phone }  -> server sends SMS
 *   verifyOtp  -> POST /auth/otp/verify  { requestId, otp } -> returns token
 * Options: AWS Cognito (SMS via SNS), Firebase Phone Auth, Twilio Verify,
 * MSG91 / 2Factor (India). Keep the same function signatures and only the
 * bodies of requestOtp / verifyOtp need to change. Store the real token with
 * expo-secure-store on iOS/Android.
 */

export interface AuthSession {
  token: string;
  /** 10-digit Indian mobile number, without +91 */
  phone: string;
  loggedInAt: string;
}

export interface OtpRequest {
  requestId: string;
  phone: string;
  /** epoch ms after which the code stops working */
  expiresAt: number;
  /** epoch ms after which "Resend code" is allowed */
  resendAfter: number;
  /** Demo only: the code that a real server would send by SMS. */
  devOtp?: string;
}

export type AuthErrorCode = 'invalid_phone' | 'wrong_code' | 'expired' | 'too_many_attempts';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 3;
const SESSION_KEY = 'creditins.auth.session';

const pending = new Map<string, { phone: string; otp: string; expiresAt: number; attempts: number }>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Accepts "9876543210", "+91 98765 43210", "09876543210" etc.
 * Returns the 10-digit number, or null if it is not a valid Indian mobile.
 */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** "9876543210" -> "+91 98765 43210" */
export function formatIndianMobile(phone: string): string {
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

export async function requestOtp(phoneInput: string): Promise<OtpRequest> {
  await delay(800);
  const phone = normalizeIndianMobile(phoneInput);
  if (!phone) throw new AuthError('invalid_phone', 'Enter a valid 10-digit mobile number.');

  // Mock only — a real server generates this with a secure random source.
  const otp = Math.floor(Math.random() * 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, '0');
  const requestId = `otp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();

  // A new request replaces any older code for the same number.
  for (const [id, entry] of pending) if (entry.phone === phone) pending.delete(id);
  pending.set(requestId, { phone, otp, expiresAt: now + OTP_TTL_MS, attempts: 0 });

  return { requestId, phone, expiresAt: now + OTP_TTL_MS, resendAfter: now + RESEND_COOLDOWN_MS, devOtp: otp };
}

export async function verifyOtp(requestId: string, otp: string): Promise<AuthSession> {
  await delay(800);
  const entry = pending.get(requestId);
  if (!entry) throw new AuthError('expired', 'This code is no longer valid. Please request a new one.');

  if (Date.now() > entry.expiresAt) {
    pending.delete(requestId);
    throw new AuthError('expired', 'This code has expired. Please request a new one.');
  }

  if (otp !== entry.otp) {
    entry.attempts += 1;
    const left = MAX_ATTEMPTS - entry.attempts;
    if (left <= 0) {
      pending.delete(requestId);
      throw new AuthError('too_many_attempts', 'Too many wrong attempts. Please request a new code.');
    }
    throw new AuthError('wrong_code', `Incorrect code. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`);
  }

  pending.delete(requestId);
  const session: AuthSession = {
    token: `mock_${requestId}`,
    phone: entry.phone,
    loggedInAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/** Returns the saved session so the user stays logged in after reopening the app. */
export async function restoreSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    return session.token && session.phone ? session : null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

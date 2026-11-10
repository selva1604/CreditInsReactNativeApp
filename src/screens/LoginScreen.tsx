import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import {
  AuthError,
  AuthSession,
  OTP_LENGTH,
  OtpRequest,
  formatIndianMobile,
  normalizeIndianMobile,
  requestOtp,
  verifyOtp,
} from '../services/authService';

interface Props {
  onLoggedIn: (session: AuthSession) => void;
}

type Step = 'phone' | 'otp';

function errorMessage(e: unknown): string {
  return e instanceof AuthError ? e.message : 'Something went wrong. Please check your connection and try again.';
}

/** Keeps only digits and drops a pasted/autofilled +91 prefix. */
function cleanPhoneInput(text: string): string {
  let digits = text.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  return digits.slice(0, 10);
}

export default function LoginScreen({ onLoggedIn }: Props) {
  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [request, setRequest] = useState<OtpRequest | null>(null);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Set when the code expired or was locked — the user must request a new one. */
  const [codeDead, setCodeDead] = useState(false);
  const [now, setNow] = useState(Date.now());
  const otpRef = useRef<TextInput>(null);

  const phone = normalizeIndianMobile(phoneInput);

  // Tick once a second on the OTP step to drive the resend countdown.
  useEffect(() => {
    if (step !== 'otp') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Android back button on the OTP step returns to the number step.
  useEffect(() => {
    if (Platform.OS !== 'android' || step !== 'otp') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      changeNumber();
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const sendOtp = async () => {
    if (busy) return;
    if (!phone) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await requestOtp(phone);
      setRequest(r);
      setOtp('');
      setCodeDead(false);
      setNow(Date.now());
      setStep('otp');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (code: string) => {
    if (!request || code.length !== OTP_LENGTH || busy || codeDead) return;
    setBusy(true);
    setError(null);
    try {
      const session = await verifyOtp(request.requestId, code);
      onLoggedIn(session);
    } catch (e) {
      setError(errorMessage(e));
      setOtp('');
      if (e instanceof AuthError && (e.code === 'expired' || e.code === 'too_many_attempts')) {
        setCodeDead(true);
      } else {
        otpRef.current?.focus();
      }
      setBusy(false);
    }
  };

  const onOtpChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    if (error && !codeDead) setError(null);
    if (digits.length === OTP_LENGTH) verify(digits);
  };

  function changeNumber() {
    setStep('phone');
    setRequest(null);
    setOtp('');
    setError(null);
    setCodeDead(false);
  }

  const resendIn = request ? Math.max(0, Math.ceil((request.resendAfter - now) / 1000)) : 0;
  const canResend = !busy && (codeDead || resendIn === 0);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Text style={styles.logoText}>💳</Text>
          </View>
          <Text style={styles.brand}>CreditIns</Text>

          {step === 'phone' ? (
            <>
              <Text style={styles.title}>Log in with your mobile number</Text>
              <Text style={styles.subtitle}>We'll send you a {OTP_LENGTH}-digit code to verify it's you.</Text>

              <Text style={styles.label}>Mobile number</Text>
              <View style={[styles.phoneField, error ? styles.fieldError : null]}>
                <Text style={styles.prefix}>🇮🇳 +91</Text>
                <View style={styles.divider} />
                <TextInput
                  value={phoneInput}
                  onChangeText={(t) => {
                    setPhoneInput(cleanPhoneInput(t));
                    if (error) setError(null);
                  }}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  maxLength={14}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={sendOtp}
                  style={styles.phoneInput}
                  accessibilityLabel="Mobile number"
                />
              </View>
              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                onPress={sendOtp}
                disabled={busy || !phone}
                style={({ pressed }) => [
                  styles.button,
                  (busy || !phone) && styles.buttonDisabled,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Get OTP</Text>}
              </Pressable>

              <Text style={styles.terms}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Enter verification code</Text>
              <Text style={styles.subtitle}>
                Sent to <Text style={styles.bold}>{request && formatIndianMobile(request.phone)}</Text>
              </Text>
              <Pressable onPress={changeNumber} hitSlop={8} disabled={busy}>
                <Text style={styles.link}>Change number</Text>
              </Pressable>

              {request?.devOtp && (
                <View style={styles.demoBanner}>
                  <Text style={styles.demoText}>
                    Demo mode — no SMS is sent. Your code is <Text style={styles.bold}>{request.devOtp}</Text>
                  </Text>
                </View>
              )}

              <View style={styles.otpRow}>
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      i === otp.length && !codeDead && styles.otpBoxActive,
                      error ? styles.fieldError : null,
                    ]}
                  >
                    <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
                  </View>
                ))}
                {/* One real input sits invisibly over the boxes: handles typing, paste and SMS autofill. */}
                <TextInput
                  ref={otpRef}
                  value={otp}
                  onChangeText={onOtpChange}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                  maxLength={OTP_LENGTH}
                  autoFocus
                  editable={!busy && !codeDead}
                  caretHidden
                  style={styles.hiddenInput}
                  accessibilityLabel="Verification code"
                />
              </View>

              {error && <Text style={[styles.error, styles.center]}>{error}</Text>}
              {busy && <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.primary} />}

              <View style={styles.resendRow}>
                <Text style={styles.muted}>Didn't get the code? </Text>
                {canResend ? (
                  <Pressable onPress={sendOtp} hitSlop={8}>
                    <Text style={styles.link}>Resend code</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.muted}>Resend in {resendIn}s</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoText: { fontSize: 30 },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl * 1.5,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20 },
  bold: { fontWeight: '700', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  phoneField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 54,
  },
  prefix: { fontSize: 16, fontWeight: '600', color: colors.text },
  divider: { width: 1, height: 24, backgroundColor: colors.border, marginHorizontal: spacing.md },
  phoneInput: { flex: 1, fontSize: 17, color: colors.text, letterSpacing: 1, height: '100%' },
  fieldError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  center: { textAlign: 'center' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  terms: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700', marginTop: spacing.xs },
  demoBanner: {
    backgroundColor: colors.infoBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  demoText: { color: colors.info, fontSize: 13 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  otpBox: {
    flex: 1,
    maxWidth: 52,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: { borderColor: colors.primary },
  otpDigit: { fontSize: 22, fontWeight: '700', color: colors.text },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: 'transparent',
  },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  muted: { fontSize: 14, color: colors.textMuted },
});

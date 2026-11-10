import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import {
  detectNetwork,
  formatCardNumber,
  formatExpiry,
  isCvvValid,
  isExpiryValid,
  luhnCheck,
  onlyDigits,
} from '../../utils/cardValidation';

export interface CardFormValue {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

export type CardFormErrors = Partial<Record<keyof CardFormValue, string>>;

export const emptyCardForm: CardFormValue = { number: '', name: '', expiry: '', cvv: '' };

export function validateCardForm(v: CardFormValue): CardFormErrors {
  const errors: CardFormErrors = {};
  const network = detectNetwork(v.number);
  if (!luhnCheck(v.number)) errors.number = 'Enter a valid card number';
  if (v.name.trim().length < 2) errors.name = 'Enter the name on the card';
  if (!isExpiryValid(v.expiry)) errors.expiry = 'Invalid or expired';
  if (!isCvvValid(v.cvv, network)) errors.cvv = network === 'AMEX' ? 'Enter 4 digits' : 'Enter 3 digits';
  return errors;
}

interface Props {
  value: CardFormValue;
  onChange: (value: CardFormValue) => void;
  /** Show every error (e.g. after the user pressed Pay). */
  showErrors: boolean;
}

export default function DebitCardForm({ value, onChange, showErrors }: Props) {
  const [touched, setTouched] = useState<Partial<Record<keyof CardFormValue, boolean>>>({});
  const errors = validateCardForm(value);
  const network = detectNetwork(value.number);

  const errorFor = (field: keyof CardFormValue) =>
    showErrors || touched[field] ? errors[field] : undefined;

  const blur = (field: keyof CardFormValue) => () => setTouched((t) => ({ ...t, [field]: true }));

  return (
    <View>
      <Field
        label="Card Number"
        right={network ?? undefined}
        error={errorFor('number')}
        value={value.number}
        onChangeText={(t) => onChange({ ...value, number: formatCardNumber(t) })}
        onBlur={blur('number')}
        placeholder="1234 5678 9012 3456"
        keyboardType="number-pad"
        maxLength={23}
        autoComplete="cc-number"
      />
      <Field
        label="Name on Card"
        error={errorFor('name')}
        value={value.name}
        onChangeText={(t) => onChange({ ...value, name: t.toUpperCase() })}
        onBlur={blur('name')}
        placeholder="FULL NAME"
        autoCapitalize="characters"
        autoComplete="name"
      />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field
            label="Expiry (MM/YY)"
            error={errorFor('expiry')}
            value={value.expiry}
            onChangeText={(t) => onChange({ ...value, expiry: formatExpiry(t) })}
            onBlur={blur('expiry')}
            placeholder="MM/YY"
            keyboardType="number-pad"
            maxLength={5}
            autoComplete="cc-exp"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="CVV"
            error={errorFor('cvv')}
            value={value.cvv}
            onChangeText={(t) => onChange({ ...value, cvv: onlyDigits(t).slice(0, 4) })}
            onBlur={blur('cvv')}
            placeholder={network === 'AMEX' ? '••••' : '•••'}
            keyboardType="number-pad"
            maxLength={network === 'AMEX' ? 4 : 3}
            secureTextEntry
            autoComplete="cc-csc"
          />
        </View>
      </View>
      <Text style={styles.secureNote}>🔒 Card details are encrypted and are never stored on this device.</Text>
    </View>
  );
}

function Field({ label, error, right, ...inputProps }: TextInputProps & { label: string; error?: string; right?: string }) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {!!right && <Text style={styles.network}>{right}</Text>}
      </View>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !!error && styles.inputError]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  network: { fontSize: 12, fontWeight: '800', color: colors.primary, fontStyle: 'italic' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  secureNote: { fontSize: 12, color: colors.textMuted },
});

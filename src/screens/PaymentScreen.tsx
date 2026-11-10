import React, { useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AmountOption,
  CreditCard,
  PaymentAllocation,
  PaymentMethod,
  PaymentScope,
} from '../types';
import { colors, radius, spacing } from '../theme';
import { formatCurrency, formatNumber } from '../utils/format';
import { onlyDigits } from '../utils/cardValidation';
import { calculatePaymentRewards } from '../utils/rewards';
import { BANKS, WALLETS, processPayment } from '../services/paymentService';
import Segmented from '../components/payment/Segmented';
import RadioRow from '../components/payment/RadioRow';
import WalletPicker from '../components/payment/WalletPicker';
import NetBankingPicker from '../components/payment/NetBankingPicker';
import DebitCardForm, {
  CardFormValue,
  emptyCardForm,
  validateCardForm,
} from '../components/payment/DebitCardForm';
import PaymentSuccess, { Receipt } from '../components/payment/PaymentSuccess';
import StatusBadge from '../components/StatusBadge';

interface Props {
  cards: CreditCard[];
  initialScope: PaymentScope;
  onBack: () => void;
  /** Called once the payment succeeds, so the dashboard can update balances. */
  onPaid: (allocations: PaymentAllocation[]) => void;
}

type Status = 'form' | 'processing' | 'success';

const cardLabel = (c: CreditCard) => `${c.bankName} •••• ${c.last4}`;

function parseAmount(text: string): number {
  const n = Number(text.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function defaultOptionFor(card: CreditCard | undefined): AmountOption {
  return card && card.minimumDue > 0 ? 'minimum' : 'total';
}

export default function PaymentScreen({ cards, initialScope, onBack, onPaid }: Props) {
  const insets = useSafeAreaInsets();
  const payableCards = useMemo(() => cards.filter((c) => c.outstanding > 0), [cards]);

  // ----- What to pay -----
  const [scopeType, setScopeType] = useState<'single' | 'all'>(initialScope.type);
  const [cardId, setCardId] = useState<string>(
    initialScope.type === 'single' ? initialScope.cardId : payableCards[0]?.id ?? '',
  );
  const selectedCard = cards.find((c) => c.id === cardId);
  const [amountOption, setAmountOption] = useState<AmountOption>(
    initialScope.type === 'all'
      ? payableCards.some((c) => c.minimumDue > 0) ? 'minimum' : 'total'
      : defaultOptionFor(selectedCard),
  );
  const [customAmount, setCustomAmount] = useState('');

  // ----- How to pay -----
  const [method, setMethod] = useState<PaymentMethod>('wallet');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [bankId, setBankId] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<CardFormValue>(emptyCardForm);

  // ----- Flow -----
  const [status, setStatus] = useState<Status>('form');
  const [attempted, setAttempted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // Android hardware back button: go back, but never while a payment is processing.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (status !== 'processing') onBack();
      return true;
    });
    return () => sub.remove();
  }, [status, onBack]);

  const totalMinAll = payableCards.reduce((s, c) => s + c.minimumDue, 0);
  const totalOutstandingAll = payableCards.reduce((s, c) => s + c.outstanding, 0);

  const allocations: PaymentAllocation[] = useMemo(() => {
    if (scopeType === 'all') {
      return payableCards
        .map((c) => ({ cardId: c.id, amount: amountOption === 'total' ? c.outstanding : c.minimumDue }))
        .filter((a) => a.amount > 0);
    }
    if (!selectedCard) return [];
    const amount =
      amountOption === 'minimum'
        ? selectedCard.minimumDue
        : amountOption === 'total'
          ? selectedCard.outstanding
          : parseAmount(customAmount);
    return amount > 0 ? [{ cardId: selectedCard.id, amount }] : [];
  }, [scopeType, payableCards, selectedCard, amountOption, customAmount]);

  const total = allocations.reduce((s, a) => s + a.amount, 0);

  // ----- Reward points preview (calculated on the cards' current, pre-payment state) -----
  const rewards = useMemo(
    () =>
      allocations.map((a) => {
        const card = cards.find((c) => c.id === a.cardId)!;
        return calculatePaymentRewards(card, a.amount);
      }),
    [allocations, cards],
  );
  const pointsToEarn = rewards.reduce((s, r) => s + r.total, 0);

  const pointsFor = (card: CreditCard, amount: number) => calculatePaymentRewards(card, amount).total;
  const pointsForAll = (option: 'minimum' | 'total') =>
    payableCards.reduce((s, c) => {
      const amt = option === 'total' ? c.outstanding : c.minimumDue;
      return amt > 0 ? s + pointsFor(c, amt) : s;
    }, 0);

  // ----- Validation -----
  let amountError: string | null = null;
  if (scopeType === 'single' && amountOption === 'custom' && selectedCard) {
    const amt = parseAmount(customAmount);
    if (amt <= 0) amountError = 'Enter an amount to pay';
    else if (amt > selectedCard.outstanding)
      amountError = `Amount cannot be more than ${formatCurrency(selectedCard.outstanding)}`;
  } else if (total <= 0) {
    amountError = 'There is nothing to pay';
  }

  const wallet = WALLETS.find((w) => w.id === walletId);
  const bank = BANKS.find((b) => b.id === bankId);
  const cardErrors = validateCardForm(cardForm);

  let methodError: string | null = null;
  if (method === 'wallet') {
    if (!wallet) methodError = 'Choose a wallet';
    else if (wallet.balance < total) methodError = 'Insufficient wallet balance';
  } else if (method === 'netbanking') {
    if (!bank) methodError = 'Choose your bank';
  } else if (Object.keys(cardErrors).length > 0) {
    methodError = 'Check your card details';
  }

  const methodLabel =
    method === 'wallet'
      ? wallet?.name ?? 'Wallet'
      : method === 'netbanking'
        ? `Net Banking · ${bank?.name ?? ''}`
        : `Debit card •••• ${onlyDigits(cardForm.number).slice(-4)}`;

  // ----- Handlers -----
  const selectCard = (id: string) => {
    setCardId(id);
    setAmountOption(defaultOptionFor(cards.find((c) => c.id === id)));
    setCustomAmount('');
  };

  const changeScope = (type: 'single' | 'all') => {
    setScopeType(type);
    if (type === 'all') {
      setAmountOption(totalMinAll > 0 ? 'minimum' : 'total');
    } else {
      if (!selectedCard || selectedCard.outstanding <= 0) setCardId(payableCards[0]?.id ?? '');
      setAmountOption(defaultOptionFor(selectedCard ?? payableCards[0]));
    }
  };

  const handlePay = async () => {
    setAttempted(true);
    setFailure(null);
    if (amountError || methodError) return;

    setStatus('processing');
    try {
      const result = await processPayment({ allocations, total, method, methodLabel });
      if (!result.success) {
        setFailure(result.message ?? 'Payment failed. Please try again.');
        setStatus('form');
        return;
      }
      // Snapshot the receipt before balances change.
      setReceipt({
        transactionId: result.transactionId,
        paidAt: result.paidAt,
        total,
        methodLabel,
        pointsEarned: pointsToEarn,
        lines: allocations.map((a, i) => {
          const card = cards.find((c) => c.id === a.cardId);
          return { label: card ? cardLabel(card) : a.cardId, amount: a.amount, rewards: rewards[i] };
        }),
      });
      onPaid(allocations);
      setCardForm(emptyCardForm); // never keep card details around
      setStatus('success');
    } catch {
      setFailure('Network error. Please check your connection and try again.');
      setStatus('form');
    }
  };

  // ----- Render -----
  if (status === 'success' && receipt) {
    return (
      <SafeAreaView style={styles.safe}>
        <PaymentSuccess receipt={receipt} onDone={onBack} />
      </SafeAreaView>
    );
  }

  if (payableCards.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={onBack} />
        <View style={styles.center}>
          <Text style={styles.allPaid}>🎉 All your cards are fully paid.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header onBack={onBack} disabled={status === 'processing'} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* ---------- Step 1: what to pay ---------- */}
          <Section title="1. What would you like to pay?">
            <Segmented
              options={[
                { value: 'single', label: 'Single Card' },
                { value: 'all', label: `All Cards (${payableCards.length})` },
              ]}
              value={scopeType}
              onChange={changeScope}
            />

            {scopeType === 'single' ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                  {payableCards.map((c) => {
                    const active = c.id === cardId;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => selectCard(c.id)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <View style={[styles.chipDot, { backgroundColor: c.gradient[1] }]} />
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{cardLabel(c)}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {selectedCard && (
                  <>
                    <View style={styles.cardSummary}>
                      <Text style={styles.cardSummaryName}>{selectedCard.cardName}</Text>
                      <StatusBadge card={selectedCard} />
                    </View>
                    <RadioRow
                      label="Minimum Due"
                      sublabel={
                        selectedCard.minimumDue > 0
                          ? `Avoids late fee · Earn ${formatNumber(pointsFor(selectedCard, selectedCard.minimumDue))} pts`
                          : 'Already paid'
                      }
                      right={formatCurrency(selectedCard.minimumDue)}
                      selected={amountOption === 'minimum'}
                      disabled={selectedCard.minimumDue <= 0}
                      onPress={() => setAmountOption('minimum')}
                    />
                    <RadioRow
                      label="Total Outstanding"
                      sublabel={`Avoids interest · Earn ${formatNumber(pointsFor(selectedCard, selectedCard.outstanding))} pts`}
                      right={formatCurrency(selectedCard.outstanding)}
                      selected={amountOption === 'total'}
                      onPress={() => setAmountOption('total')}
                    />
                    <RadioRow
                      label="Other Amount"
                      sublabel="Enter any amount"
                      selected={amountOption === 'custom'}
                      onPress={() => setAmountOption('custom')}
                    />
                    {amountOption === 'custom' && (
                      <View style={styles.customBox}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput
                          value={customAmount}
                          onChangeText={(t) => setCustomAmount(t.replace(/[^0-9.]/g, ''))}
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="decimal-pad"
                          style={styles.customInput}
                          autoFocus
                        />
                      </View>
                    )}
                    {amountOption === 'custom' && pointsToEarn > 0 && !amountError && (
                      <Text style={styles.pointsHint}>🎁 You’ll earn {formatNumber(pointsToEarn)} reward points</Text>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <View style={{ height: spacing.md }} />
                <RadioRow
                  label="Minimum Due on All Cards"
                  sublabel={`Avoids late fees · Earn ${formatNumber(pointsForAll('minimum'))} pts`}
                  right={formatCurrency(totalMinAll)}
                  selected={amountOption === 'minimum'}
                  disabled={totalMinAll <= 0}
                  onPress={() => setAmountOption('minimum')}
                />
                <RadioRow
                  label="Total Outstanding on All Cards"
                  sublabel={`Clears every card · Earn ${formatNumber(pointsForAll('total'))} pts`}
                  right={formatCurrency(totalOutstandingAll)}
                  selected={amountOption === 'total'}
                  onPress={() => setAmountOption('total')}
                />
                <View style={styles.breakdown}>
                  {allocations.map((a, i) => {
                    const c = cards.find((x) => x.id === a.cardId)!;
                    return (
                      <View key={a.cardId} style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{cardLabel(c)}</Text>
                        <Text style={styles.breakdownValue}>
                          {formatCurrency(a.amount)}
                          <Text style={styles.breakdownPoints}>  +{formatNumber(rewards[i].total)} pts</Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {attempted && amountError && <Text style={styles.error}>{amountError}</Text>}
          </Section>

          {/* ---------- Step 2: how to pay ---------- */}
          <Section title="2. Choose payment method">
            <Segmented
              options={[
                { value: 'wallet', label: 'Wallet' },
                { value: 'netbanking', label: 'Net Banking' },
                { value: 'card', label: 'Debit Card' },
              ]}
              value={method}
              onChange={(m) => {
                setMethod(m);
                setFailure(null);
              }}
            />
            <View style={{ height: spacing.md }} />

            {method === 'wallet' && (
              <WalletPicker wallets={WALLETS} selectedId={walletId} amount={total} onSelect={setWalletId} />
            )}
            {method === 'netbanking' && (
              <NetBankingPicker banks={BANKS} selectedId={bankId} onSelect={setBankId} />
            )}
            {method === 'card' && (
              <DebitCardForm value={cardForm} onChange={setCardForm} showErrors={attempted} />
            )}

            {attempted && methodError && <Text style={styles.error}>{methodError}</Text>}
          </Section>

          {failure && (
            <View style={styles.failure}>
              <Text style={styles.failureText}>{failure}</Text>
            </View>
          )}
        </ScrollView>

        {/* ---------- Sticky pay bar ---------- */}
        <View style={[styles.payBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View>
            <Text style={styles.payBarLabel}>Total Payable</Text>
            <Text style={styles.payBarAmount}>{formatCurrency(total)}</Text>
            {pointsToEarn > 0 && (
              <Text style={styles.payBarPoints}>🎁 +{formatNumber(pointsToEarn)} reward pts</Text>
            )}
          </View>
          <Pressable
            onPress={handlePay}
            disabled={status === 'processing' || total <= 0}
            style={({ pressed }) => [
              styles.payButton,
              (status === 'processing' || total <= 0) && { opacity: 0.6 },
              pressed && { opacity: 0.85 },
            ]}
          >
            {status === 'processing' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payButtonText}>Pay {formatCurrency(total)}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ onBack, disabled }: { onBack: () => void; disabled?: boolean }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} disabled={disabled} hitSlop={12} style={styles.backButton}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>Make a Payment</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  allPaid: { fontSize: 16, color: colors.text, fontWeight: '600' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.lg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 32, lineHeight: 34, color: colors.text, fontWeight: '400' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.md },

  chips: { marginVertical: spacing.md, flexGrow: 0 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#EEF2FF' },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary },

  cardSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardSummaryName: { fontSize: 14, fontWeight: '700', color: colors.text },

  customBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  currency: { fontSize: 20, fontWeight: '700', color: colors.text, marginRight: 6 },
  customInput: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text, paddingVertical: 12 },

  breakdown: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { fontSize: 13, color: colors.textMuted },
  breakdownValue: { fontSize: 13, fontWeight: '700', color: colors.text },

  error: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  failure: { backgroundColor: colors.dangerBg, borderRadius: radius.md, padding: spacing.md },
  failureText: { color: colors.danger, fontWeight: '600', fontSize: 13 },

  payBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  payBarLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  payBarAmount: { fontSize: 20, fontWeight: '800', color: colors.text },
  payBarPoints: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: 2 },
  pointsHint: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  breakdownPoints: { fontSize: 12, fontWeight: '700', color: colors.primary },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    minWidth: 150,
    alignItems: 'center',
  },
  payButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

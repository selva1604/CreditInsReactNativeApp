import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RewardBreakdown } from '../../types';
import { colors, radius, spacing } from '../../theme';
import { formatCurrency, formatDate, formatNumber, toISODate } from '../../utils/format';
import { describeBreakdown } from '../../utils/rewards';

export interface Receipt {
  transactionId: string;
  paidAt: string;
  total: number;
  methodLabel: string;
  pointsEarned: number;
  lines: { label: string; amount: number; rewards: RewardBreakdown }[];
}

interface Props {
  receipt: Receipt;
  onDone: () => void;
}

export default function PaymentSuccess({ receipt, onDone }: Props) {
  const paidAt = new Date(receipt.paidAt);
  const time = paidAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>✓</Text>
      </View>
      <Text style={styles.title}>Payment Successful</Text>
      <Text style={styles.amount}>{formatCurrency(receipt.total)}</Text>

      {receipt.pointsEarned > 0 && (
        <View style={styles.rewardBox}>
          <Text style={styles.rewardTitle}>🎁 You earned {formatNumber(receipt.pointsEarned)} reward points</Text>
          {receipt.lines
            .filter((l) => l.rewards.total > 0)
            .map((line) => (
              <View key={line.label} style={styles.rewardLine}>
                <View style={styles.rowBetween}>
                  <Text style={styles.rewardCard}>{line.label}</Text>
                  <Text style={styles.rewardPoints}>+{formatNumber(line.rewards.total)}</Text>
                </View>
                <Text style={styles.rewardDetail}>{describeBreakdown(line.rewards)}</Text>
              </View>
            ))}
        </View>
      )}

      <View style={styles.box}>
        <Row label="Transaction ID" value={receipt.transactionId} />
        <Row label="Date & Time" value={`${formatDate(toISODate(paidAt))}, ${time}`} />
        <Row label="Paid using" value={receipt.methodLabel} />
        <View style={styles.divider} />
        {receipt.lines.map((line) => (
          <Row key={line.label} label={line.label} value={formatCurrency(line.amount)} />
        ))}
      </View>

      <Text style={styles.note}>It may take up to 24 hours for the payment to reflect on your card statement.</Text>

      <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]} onPress={onDone}>
        <Text style={styles.buttonText}>Back to Dashboard</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, alignItems: 'center', paddingTop: spacing.xl * 2 },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 38, color: colors.success, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: spacing.lg },
  amount: { fontSize: 32, fontWeight: '800', color: colors.success, marginTop: spacing.xs },
  rewardBox: {
    alignSelf: 'stretch',
    backgroundColor: '#EEF2FF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  rewardTitle: { fontSize: 15, fontWeight: '800', color: colors.primary, marginBottom: spacing.sm },
  rewardLine: { paddingVertical: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  rewardCard: { fontSize: 13, fontWeight: '600', color: colors.text },
  rewardPoints: { fontSize: 13, fontWeight: '800', color: colors.primary },
  rewardDetail: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  box: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: spacing.md },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowValue: { fontSize: 13, fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  button: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CreditCard } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatCurrency, formatDate, formatNumber } from '../utils/format';
import StatusBadge from './StatusBadge';
import { describeRewardRule } from '../utils/rewards';

interface Props {
  card: CreditCard;
  onPay: (card: CreditCard) => void;
}

export default function CardDetails({ card, onPay }: Props) {
  const available = Math.max(card.creditLimit - card.outstanding, 0);
  const utilization = card.creditLimit > 0 ? card.outstanding / card.creditLimit : 0;
  const utilPct = Math.round(utilization * 100);
  const barColor = utilization > 0.7 ? colors.danger : utilization > 0.3 ? colors.warning : colors.success;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {card.cardName} •••• {card.last4}
        </Text>
        <StatusBadge card={card} />
      </View>

      <View style={styles.dueBox}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Minimum Due</Text>
          <Text style={styles.dueAmount}>{formatCurrency(card.minimumDue)}</Text>
          <Text style={styles.subText}>by {formatDate(card.dueDate)}</Text>
        </View>
        {card.outstanding > 0 && (
          <Pressable
            style={({ pressed }) => [styles.payButton, pressed && { opacity: 0.8 }]}
            onPress={() => onPay(card)}
          >
            <Text style={styles.payText}>Pay Now</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        <Info label="Total Outstanding" value={formatCurrency(card.outstanding)} />
        <Info label="Available Limit" value={formatCurrency(available)} />
        <Info label="Credit Limit" value={formatCurrency(card.creditLimit)} />
        <Info label="Reward Points" value={formatNumber(card.rewardPoints)} />
        <Info label="Statement Date" value={formatDate(card.statementDate)} />
        <Info label="Billing Due Date" value={formatDate(card.dueDate)} />
      </View>

      <View style={styles.rewardRule}>
        <Text style={styles.rewardRuleTitle}>🎁 Earn on every payment</Text>
        <Text style={styles.rewardRuleText}>{describeRewardRule(card.rewardRule)}</Text>
      </View>

      <View style={styles.utilHeader}>
        <Text style={styles.label}>Credit Utilization</Text>
        <Text style={[styles.label, { color: barColor }]}>{utilPct}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(utilPct, 100)}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: { gap: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  dueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  dueAmount: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 2 },
  subText: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  payButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
  },
  payText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  infoCell: { width: '50%', paddingVertical: spacing.sm },
  infoValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
  rewardRule: {
    backgroundColor: '#EEF2FF',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rewardRuleTitle: { fontSize: 12, fontWeight: '700', color: colors.primary },
  rewardRuleText: { fontSize: 12, color: colors.text, marginTop: 2 },
  utilHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});

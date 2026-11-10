import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CreditCard, InsuranceType } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatCurrency, formatDate, formatNumber } from '../utils/format';

interface Props {
  cards: CreditCard[];
  onRenewInsurance: (type: InsuranceType) => void;
}

export default function SummaryHeader({ cards, onRenewInsurance }: Props) {
  const summary = useMemo(() => {
    const totalPoints = cards.reduce((sum, c) => sum + c.rewardPoints, 0);
    const totalOutstanding = cards.reduce((sum, c) => sum + c.outstanding, 0);
    const totalMinDue = cards.reduce((sum, c) => sum + c.minimumDue, 0);
    const nextDue = cards
      .filter((c) => c.minimumDue > 0)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    return { totalPoints, totalOutstanding, totalMinDue, nextDue };
  }, [cards]);

  return (
    <View style={styles.container}>
      <View style={styles.pointsBox}>
        <Text style={styles.pointsLabel}>Total Reward Points</Text>
        <Text style={styles.pointsValue}>{formatNumber(summary.totalPoints)}</Text>
        <Text style={styles.pointsSub}>across {cards.length} cards</Text>

        <Text style={styles.redeemLabel}>Use your points to renew</Text>
        <View style={styles.renewRow}>
          <RenewButton icon="🏥" label="Renew Health Insurance" onPress={() => onRenewInsurance('health')} />
          <RenewButton icon="🚗" label="Renew Vehicle Insurance" onPress={() => onRenewInsurance('vehicle')} />
        </View>
      </View>

      <View style={styles.row}>
        <Stat label="Total Outstanding" value={formatCurrency(summary.totalOutstanding)} />
        <Stat
          label="Total Min. Due"
          value={formatCurrency(summary.totalMinDue)}
          valueColor={summary.totalMinDue > 0 ? colors.danger : colors.success}
        />
        <Stat
          label="Next Due"
          value={summary.nextDue ? formatDate(summary.nextDue.dueDate) : 'None'}
        />
      </View>
    </View>
  );
}

function RenewButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.renewButton, pressed && { opacity: 0.8 }]}
    >
      <Text style={styles.renewIcon}>{icon}</Text>
      <Text style={styles.renewText}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
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
  pointsBox: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  pointsLabel: { color: '#E0E7FF', fontSize: 13, fontWeight: '600' },
  pointsValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginTop: spacing.xs },
  pointsSub: { color: '#C7D2FE', fontSize: 12, marginTop: 2 },
  redeemLabel: { color: '#E0E7FF', fontSize: 12, fontWeight: '600', marginTop: spacing.lg, marginBottom: spacing.sm },
  renewRow: { flexDirection: 'row', gap: spacing.sm },
  renewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
  },
  renewIcon: { fontSize: 18 },
  renewText: { flex: 1, color: colors.primary, fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1 },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '700' },
});

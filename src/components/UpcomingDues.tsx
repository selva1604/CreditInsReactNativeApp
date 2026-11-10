import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CreditCard } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatCurrency, formatDate } from '../utils/format';
import StatusBadge from './StatusBadge';

interface Props {
  cards: CreditCard[];
  onSelect: (card: CreditCard) => void;
}

/** List of every card's billing due date, soonest first (paid cards last). */
export default function UpcomingDues({ cards, onSelect }: Props) {
  const sorted = useMemo(
    () =>
      [...cards].sort((a, b) => {
        const aPaid = a.minimumDue <= 0 ? 1 : 0;
        const bPaid = b.minimumDue <= 0 ? 1 : 0;
        if (aPaid !== bPaid) return aPaid - bPaid;
        return a.dueDate.localeCompare(b.dueDate);
      }),
    [cards],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Billing Due Dates</Text>
      {sorted.map((card, index) => (
        <Pressable
          key={card.id}
          onPress={() => onSelect(card)}
          style={({ pressed }) => [
            styles.row,
            index < sorted.length - 1 && styles.divider,
            pressed && { backgroundColor: colors.background },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: card.gradient[1] }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {card.bankName} •••• {card.last4}
            </Text>
            <Text style={styles.date}>{formatDate(card.dueDate)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={styles.amount}>{formatCurrency(card.minimumDue)}</Text>
            <StatusBadge card={card} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700', color: colors.text },
});

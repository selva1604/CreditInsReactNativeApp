import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CreditCard, DueStatus } from '../types';
import { colors } from '../theme';
import { describeDue, getDueStatus } from '../utils/format';

const palette: Record<DueStatus, { fg: string; bg: string }> = {
  paid: { fg: colors.success, bg: colors.successBg },
  overdue: { fg: colors.danger, bg: colors.dangerBg },
  'due-soon': { fg: colors.warning, bg: colors.warningBg },
  upcoming: { fg: colors.info, bg: colors.infoBg },
};

export default function StatusBadge({ card }: { card: CreditCard }) {
  const { fg, bg } = palette[getDueStatus(card)];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{describeDue(card)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700' },
});

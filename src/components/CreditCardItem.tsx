import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard } from '../types';
import { radius, spacing } from '../theme';
import { formatDate } from '../utils/format';

interface Props {
  card: CreditCard;
  width: number;
  selected: boolean;
  onPress: () => void;
}

export default function CreditCardItem({ card, width, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${card.bankName} ${card.cardName} ending in ${card.last4}`}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.9 : 1 }]}
    >
      <LinearGradient
        colors={card.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, selected && styles.selected]}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.bank}>{card.bankName}</Text>
            <Text style={styles.cardName}>{card.cardName}</Text>
          </View>
          <Text style={styles.network}>{card.network}</Text>
        </View>

        <View style={styles.chip} />

        <Text style={styles.number}>••••  ••••  ••••  {card.last4}</Text>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.smallLabel}>CARD HOLDER</Text>
            <Text style={styles.smallValue}>{card.holderName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.smallLabel}>PAYMENT DUE</Text>
            <Text style={styles.smallValue}>{formatDate(card.dueDate)}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 190,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: 'rgba(255,255,255,0.85)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bank: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cardName: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  network: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  chip: {
    width: 40,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E5C07B',
    opacity: 0.9,
  },
  number: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', letterSpacing: 2 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '600', letterSpacing: 1 },
  smallValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginTop: 2 },
});

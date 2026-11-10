import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, InsuranceType, PaymentScope } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatCurrency } from '../utils/format';
import SummaryHeader from '../components/SummaryHeader';
import CreditCardItem from '../components/CreditCardItem';
import CardDetails from '../components/CardDetails';
import UpcomingDues from '../components/UpcomingDues';

const CARD_GAP = 12;

interface Props {
  cards: CreditCard[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onPay: (scope: PaymentScope) => void;
  onRenewInsurance: (type: InsuranceType) => void;
  /** Logged-in mobile number, already formatted for display */
  phoneLabel: string;
  onLogout: () => void;
}

export default function DashboardScreen({
  cards,
  loading,
  onRefresh,
  onPay,
  onRenewInsurance,
  phoneLabel,
  onLogout,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(screenWidth - spacing.lg * 2 - 24, 380);
  const snapInterval = cardWidth + CARD_GAP;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<CreditCard>>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const selectIndex = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      listRef.current?.scrollToOffset({ offset: index * snapInterval, animated: true });
    },
    [snapInterval],
  );

  const onCarouselScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
    setSelectedIndex(Math.max(0, Math.min(index, cards.length - 1)));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.empty}>No credit cards linked yet.</Text>
        <Pressable onPress={onLogout} hitSlop={8} style={{ marginTop: spacing.lg }}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const selectedCard = cards[Math.min(selectedIndex, cards.length - 1)];
  const cardsWithBalance = cards.filter((c) => c.outstanding > 0);
  const totalMinDue = cards.reduce((s, c) => s + c.minimumDue, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Welcome back 👋 {phoneLabel}</Text>
            <Text style={styles.title}>My Credit Cards</Text>
          </View>
          <Pressable
            onPress={onLogout}
            hitSlop={8}
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
            accessibilityLabel="Log out"
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        <SummaryHeader cards={cards} onRenewInsurance={onRenewInsurance} />

        {cardsWithBalance.length > 1 && (
          <Pressable
            onPress={() => onPay({ type: 'all' })}
            style={({ pressed }) => [styles.payAll, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.payAllText}>Pay All Card Dues</Text>
            {totalMinDue > 0 && (
              <Text style={styles.payAllSub}>Min. {formatCurrency(totalMinDue)} on {cardsWithBalance.length} cards</Text>
            )}
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Your Cards</Text>
        <FlatList
          ref={listRef}
          data={cards}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
          getItemLayout={(_, index) => ({ length: snapInterval, offset: snapInterval * index, index })}
          onMomentumScrollEnd={onCarouselScrollEnd}
          renderItem={({ item, index }) => (
            <CreditCardItem
              card={item}
              width={cardWidth}
              selected={index === selectedIndex}
              onPress={() => selectIndex(index)}
            />
          )}
        />

        <View style={styles.dots}>
          {cards.map((c, i) => (
            <View key={c.id} style={[styles.dot, i === selectedIndex && styles.dotActive]} />
          ))}
        </View>

        <CardDetails card={selectedCard} onPay={(card) => onPay({ type: 'single', cardId: card.id })} />

        <View style={{ height: spacing.lg }} />

        <UpcomingDues
          cards={cards}
          onSelect={(card) => selectIndex(cards.findIndex((c) => c.id === card.id))}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: spacing.xl * 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logoutText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  greeting: { fontSize: 14, color: colors.textMuted },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 2 },
  payAll: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payAllText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  payAllSub: { color: '#C7D2FE', fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.primary },
  empty: { fontSize: 15, color: colors.textMuted },
});

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
import Avatar from '../components/Avatar';

const CARD_GAP = 12;

interface Props {
  cards: CreditCard[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onPay: (scope: PaymentScope) => void;
  onRenewInsurance: (type: InsuranceType) => void;
  /** User's name, or their formatted mobile number if no name is set */
  displayName: string;
  /** Name used for avatar initials (empty if not set) */
  profileName: string;
  photoUri: string | null;
  onOpenProfile: () => void;
}

export default function DashboardScreen({
  cards,
  loading,
  onRefresh,
  onPay,
  onRenewInsurance,
  displayName,
  profileName,
  photoUri,
  onOpenProfile,
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
        <Pressable onPress={onOpenProfile} hitSlop={8} style={{ marginTop: spacing.lg }}>
          <Text style={styles.profileLink}>My Profile</Text>
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
            <Text style={styles.greeting} numberOfLines={1}>
              Welcome back, {displayName} 👋
            </Text>
            <Text style={styles.title}>My Credit Cards</Text>
          </View>
          <Pressable
            onPress={onOpenProfile}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            accessibilityLabel="Open my profile"
          >
            <Avatar name={profileName} photoUri={photoUri} size={44} />
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
  profileLink: { color: colors.primary, fontSize: 14, fontWeight: '700' },
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

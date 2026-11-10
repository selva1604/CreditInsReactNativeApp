import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { InsuranceProvider, InsuranceType } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatNumber } from '../utils/format';
import { getInsuranceProviders } from '../data/insuranceProviders';

interface Props {
  type: InsuranceType;
  /** Total reward points across all cards */
  rewardPoints: number;
  onBack: () => void;
  onContinue: (provider: InsuranceProvider) => void;
}

const COPY: Record<InsuranceType, { title: string; icon: string; subtitle: string }> = {
  health: {
    title: 'Renew Health Insurance',
    icon: '🏥',
    subtitle: 'Choose your health insurance company',
  },
  vehicle: {
    title: 'Renew Vehicle Insurance',
    icon: '🚗',
    subtitle: 'Choose your car or bike insurance company',
  },
};

function initials(name: string): string {
  return name
    .split(' ')
    .filter((w) => /^[A-Za-z]/.test(w) && w.toLowerCase() !== 'the')
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function InsuranceProvidersScreen({ type, rewardPoints, onBack, onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const copy = COPY[type];
  const providers = useMemo(() => getInsuranceProviders(type), [type]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? providers.filter((p) => p.name.toLowerCase().includes(q)) : providers;
  }, [providers, query]);

  const selected = providers.find((p) => p.id === selectedId);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{copy.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <View style={styles.pointsBanner}>
              <Text style={styles.bannerIcon}>{copy.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{formatNumber(rewardPoints)} reward points available</Text>
                <Text style={styles.bannerSub}>Use them as a discount on your renewal premium</Text>
              </View>
            </View>

            <Text style={styles.subtitle}>{copy.subtitle}</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search insurance company"
              placeholderTextColor={colors.textMuted}
              style={styles.search}
              autoCorrect={false}
            />
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>No insurance company matches “{query}”.</Text>}
        renderItem={({ item }) => {
          const active = item.id === selectedId;
          return (
            <Pressable
              onPress={() => setSelectedId(item.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.logo, { backgroundColor: item.color }]}>
                <Text style={styles.logoText}>{initials(item.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        }}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          disabled={!selected}
          onPress={() => selected && onContinue(selected)}
          style={({ pressed }) => [styles.continueButton, !selected && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.continueText}>
            {selected ? `Continue with ${selected.name}` : 'Select an insurance company'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 32, lineHeight: 34, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },

  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  bannerIcon: { fontSize: 30 },
  bannerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  bannerSub: { color: '#C7D2FE', fontSize: 12, marginTop: 2 },
  subtitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  empty: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: spacing.xl },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: '#EEF2FF' },
  logo: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  description: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

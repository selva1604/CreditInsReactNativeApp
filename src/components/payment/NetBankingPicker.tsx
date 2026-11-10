import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { Bank } from '../../types';
import { colors, radius, spacing } from '../../theme';
import RadioRow from './RadioRow';

interface Props {
  banks: Bank[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function NetBankingPicker({ banks, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? banks.filter((b) => b.name.toLowerCase().includes(q)) : banks;
  }, [banks, query]);

  return (
    <>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search your bank"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
      />
      {filtered.map((bank) => (
        <RadioRow
          key={bank.id}
          label={bank.name}
          selected={selectedId === bank.id}
          onPress={() => onSelect(bank.id)}
        />
      ))}
      {filtered.length === 0 && <Text style={styles.empty}>No banks match “{query}”.</Text>}
      <Text style={styles.note}>You will be redirected to your bank’s secure login page to authorise the payment.</Text>
    </>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  empty: { color: colors.textMuted, fontSize: 13, paddingVertical: spacing.sm },
  note: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
});

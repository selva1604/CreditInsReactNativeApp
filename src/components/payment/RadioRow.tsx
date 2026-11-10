import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface Props {
  label: string;
  sublabel?: string;
  right?: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export default function RadioRow({ label, sublabel, right, selected, disabled, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        disabled && { opacity: 0.45 },
        pressed && !disabled && { opacity: 0.8 },
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {!!sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
      {!!right && <Text style={styles.right}>{right}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: '#EEF2FF' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  sublabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  right: { fontSize: 14, fontWeight: '700', color: colors.text },
});

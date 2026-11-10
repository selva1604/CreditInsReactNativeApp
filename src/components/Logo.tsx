import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  /** Size of the square mark in px */
  size?: number;
  /** Show the "Payvy" wordmark next to (row) or below (column) the mark */
  wordmark?: 'none' | 'row' | 'column';
}

/** Payvy logo: a rounded "P" with a gold coin, on an indigo tile. Same design as assets/logo.svg. */
export function LogoMark({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="Payvy logo">
      <Defs>
        <LinearGradient id="payvyBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6366F1" />
          <Stop offset="1" stopColor="#4338CA" />
        </LinearGradient>
        <LinearGradient id="payvyCoin" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FCD34D" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Rect width="1024" height="1024" rx="230" fill="url(#payvyBg)" />
      <Path
        d="M367 754 V270 H527 A120 120 0 0 1 527 510 H367"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={120}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="647" cy="730" r="70" fill="url(#payvyCoin)" />
      <Circle cx="647" cy="730" r="44" fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={10} />
    </Svg>
  );
}

export default function Logo({ size = 64, wordmark = 'none' }: Props) {
  if (wordmark === 'none') return <LogoMark size={size} />;
  const row = wordmark === 'row';
  return (
    <View style={[styles.wrap, row ? styles.row : styles.column]}>
      <LogoMark size={size} />
      <Text
        style={[
          styles.word,
          { fontSize: row ? size * 0.6 : size * 0.42 },
          row ? { marginLeft: size * 0.2 } : { marginTop: size * 0.16 },
        ]}
      >
        Pay<Text style={styles.accent}>vy</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  word: { fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  accent: { color: colors.primary },
});

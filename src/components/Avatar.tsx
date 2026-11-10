import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  name: string;
  photoUri: string | null;
  size: number;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Round profile picture, falling back to the user's initials (or a person icon). */
export default function Avatar({ name, photoUri, size }: Props) {
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (photoUri) {
    return <Image source={{ uri: photoUri }} style={[styles.image, box]} accessibilityLabel="Profile picture" />;
  }

  const text = initials(name);
  return (
    <View style={[styles.fallback, box]} accessibilityLabel="Profile picture">
      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: size * (text ? 0.38 : 0.5) }}>
        {text || '👤'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.border },
  fallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});

import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  /** Emoji shown in a circle above the title */
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions like logout or delete */
  destructive?: boolean;
  /** Shows a spinner on the confirm button and blocks closing */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-app confirmation popup that looks the same on Android, iOS and web. */
export default function ConfirmDialog({
  visible,
  title,
  message,
  icon,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const close = () => {
    if (!busy) onCancel();
  };
  const accent = destructive ? colors.danger : colors.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={close}>
        {/* Inner Pressable stops taps on the card from closing the popup. */}
        <Pressable style={styles.card} onPress={() => {}} accessibilityRole="alert">
          {icon && (
            <View style={[styles.iconCircle, { backgroundColor: destructive ? colors.dangerBg : colors.infoBg }]}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={close}
              disabled={busy}
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              style={({ pressed }) => [styles.button, { backgroundColor: accent }, pressed && { opacity: 0.85 }]}
            >
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmText}>{confirmLabel}</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: { fontSize: 26 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, alignSelf: 'stretch' },
  button: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelText: { fontSize: 15, fontWeight: '700', color: colors.text },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

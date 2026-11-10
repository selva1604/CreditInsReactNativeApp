import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import Avatar from '../components/Avatar';
import { NAME_MAX_LENGTH, UserProfile, validateName } from '../services/profileService';
import { formatIndianMobile } from '../services/authService';
import { PhotoPermissionError, PhotoSource, pickProfilePhoto } from '../utils/pickPhoto';
import { confirmAction, showMessage } from '../utils/notify';

interface Props {
  profile: UserProfile;
  /** ISO date of the current login */
  loggedInAt: string;
  onBack: () => void;
  onSave: (profile: UserProfile) => Promise<void>;
  onLogout: () => void;
}

export default function ProfileScreen({ profile, loggedInAt, onBack, onSave, onLogout }: Props) {
  const [name, setName] = useState(profile.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheetOpen) setSheetOpen(false);
      else onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack, sheetOpen]);

  const nameChanged = name.trim() !== profile.name;

  const saveName = async () => {
    const err = validateName(name);
    setNameError(err);
    if (err || !nameChanged) return;
    setSavingName(true);
    try {
      await onSave({ ...profile, name: name.trim() });
      setName(name.trim());
      showMessage('Saved', 'Your name has been updated.');
    } catch {
      setNameError('Could not save your name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const changePhoto = async (source: PhotoSource) => {
    setSheetOpen(false);
    setPhotoBusy(true);
    try {
      const uri = await pickProfilePhoto(source);
      if (uri) await onSave({ ...profile, photoUri: uri });
    } catch (e) {
      showMessage(
        'Photo not updated',
        e instanceof PhotoPermissionError ? e.message : 'Could not update your profile picture. Please try again.',
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setSheetOpen(false);
    const ok = await confirmAction('Remove photo', 'Remove your profile picture?', 'Remove');
    if (!ok) return;
    setPhotoBusy(true);
    try {
      await onSave({ ...profile, photoUri: null });
    } catch {
      showMessage('Photo not removed', 'Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const loginDate = new Date(loggedInAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Profile picture */}
          <View style={styles.avatarSection}>
            <Pressable
              onPress={() => setSheetOpen(true)}
              disabled={photoBusy}
              accessibilityLabel="Change profile picture"
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <Avatar name={profile.name} photoUri={profile.photoUri} size={112} />
              {photoBusy && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => setSheetOpen(true)} disabled={photoBusy} hitSlop={8}>
              <Text style={styles.changePhotoText}>{profile.photoUri ? 'Change photo' : 'Add photo'}</Text>
            </Pressable>
            <Text style={styles.displayName}>{profile.name || 'Add your name'}</Text>
          </View>

          {/* Details */}
          <View style={styles.card}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (nameError) setNameError(null);
              }}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              maxLength={NAME_MAX_LENGTH}
              returnKeyType="done"
              onSubmitEditing={saveName}
              style={[styles.input, nameError ? styles.inputError : null]}
              accessibilityLabel="Full name"
            />
            {nameError && <Text style={styles.error}>{nameError}</Text>}
            {nameChanged && (
              <Pressable
                onPress={saveName}
                disabled={savingName}
                style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
              >
                {savingName ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save name</Text>
                )}
              </Pressable>
            )}

            <View style={styles.separator} />

            <Text style={styles.label}>Mobile number</Text>
            <View style={styles.readonlyRow}>
              <Text style={styles.readonlyValue}>{formatIndianMobile(profile.phone)}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            </View>
            <Text style={styles.hint}>Your mobile number is used to log in and can't be changed here.</Text>

            <View style={styles.separator} />

            <Text style={styles.label}>Logged in since</Text>
            <Text style={styles.readonlyValue}>{loginDate}</Text>
          </View>

          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo options sheet */}
      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Profile picture</Text>
            {Platform.OS !== 'web' && (
              <SheetOption icon="📷" label="Take photo" onPress={() => changePhoto('camera')} />
            )}
            <SheetOption
              icon="🖼️"
              label={Platform.OS === 'web' ? 'Upload photo' : 'Choose from gallery'}
              onPress={() => changePhoto('library')}
            />
            {profile.photoUri && <SheetOption icon="🗑️" label="Remove photo" danger onPress={removePhoto} />}
            <Pressable onPress={() => setSheetOpen(false)} style={styles.sheetCancel}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function SheetOption({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.sheetOption, pressed && { backgroundColor: colors.background }]}>
      <Text style={styles.sheetIcon}>{icon}</Text>
      <Text style={[styles.sheetLabel, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 26, color: colors.text, marginTop: -3 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  avatarSection: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 56,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: { fontSize: 16 },
  changePhotoText: { color: colors.primary, fontWeight: '700', fontSize: 14, marginTop: spacing.md },
  displayName: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  readonlyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readonlyValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  verifiedBadge: {
    backgroundColor: colors.successBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  verifiedText: { color: colors.success, fontSize: 12, fontWeight: '700' },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  logoutButton: {
    marginTop: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.dangerBg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  sheetIcon: { fontSize: 20, width: 32 },
  sheetLabel: { fontSize: 16, color: colors.text, fontWeight: '500' },
  sheetCancel: { marginTop: spacing.sm, alignItems: 'center', paddingVertical: spacing.md },
  sheetCancelText: { fontSize: 15, color: colors.textMuted, fontWeight: '700' },
});

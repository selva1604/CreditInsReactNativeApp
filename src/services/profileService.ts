import AsyncStorage from '@react-native-async-storage/async-storage';

/*
 * MOCK PROFILE SERVICE
 * ---------------------------------------------------------------------------
 * Profiles are saved on the device, one per mobile number. In production,
 * replace these with calls to your backend (GET/PUT /me) and upload the photo
 * to storage such as Amazon S3, saving only its URL in the profile.
 */

export interface UserProfile {
  /** 10-digit mobile number — the login identity, cannot be edited here */
  phone: string;
  name: string;
  /** Square JPEG as a data URI, or null for the default avatar */
  photoUri: string | null;
  updatedAt: string;
}

export const NAME_MAX_LENGTH = 50;

const key = (phone: string) => `creditins.profile.${phone}`;

export async function loadProfile(phone: string): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(key(phone));
  if (raw) {
    try {
      const saved = JSON.parse(raw) as Partial<UserProfile>;
      return {
        phone,
        name: saved.name ?? '',
        photoUri: saved.photoUri ?? null,
        updatedAt: saved.updatedAt ?? new Date().toISOString(),
      };
    } catch {
      // Corrupt entry — fall through to a fresh profile.
    }
  }
  return { phone, name: '', photoUri: null, updatedAt: new Date().toISOString() };
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  const updated = { ...profile, name: profile.name.trim(), updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(key(profile.phone), JSON.stringify(updated));
  return updated;
}

/** Returns an error message, or null if the name is acceptable. */
export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > NAME_MAX_LENGTH) return `Name must be at most ${NAME_MAX_LENGTH} characters.`;
  if (!/^[\p{L}][\p{L} .'-]*$/u.test(trimmed)) return 'Name can only contain letters, spaces, dots, hyphens and apostrophes.';
  return null;
}

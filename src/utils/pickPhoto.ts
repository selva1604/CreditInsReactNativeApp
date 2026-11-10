import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export type PhotoSource = 'camera' | 'library';

const AVATAR_SIZE = 320;

export class PhotoPermissionError extends Error {}

/**
 * Lets the user take or choose a photo, then center-crops it to a square and
 * shrinks it to a small JPEG. Returns a data URI, or null if they cancelled.
 * The small size keeps it light enough to store with the profile.
 */
export async function pickProfilePhoto(source: PhotoSource): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true, // native crop UI (ignored on web; we crop below)
    aspect: [1, 1],
    quality: 1,
  };

  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new PhotoPermissionError('Allow camera access in your phone settings to take a profile photo.');
    }
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }

  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];

  const side = Math.min(asset.width, asset.height);
  const actions = [];
  if (side > 0 && asset.width !== asset.height) {
    actions.push({
      crop: {
        originX: Math.floor((asset.width - side) / 2),
        originY: Math.floor((asset.height - side) / 2),
        width: side,
        height: side,
      },
    });
  }
  actions.push({ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } });

  const output = await manipulateAsync(asset.uri, actions, {
    compress: 0.7,
    format: SaveFormat.JPEG,
    base64: true,
  });
  return output.base64 ? `data:image/jpeg;base64,${output.base64}` : output.uri;
}

import { Alert, Platform } from 'react-native';

/** Simple message popup that also works in the browser (Alert is a no-op on web). */
export function showMessage(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

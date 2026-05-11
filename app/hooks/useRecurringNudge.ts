import { Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  checkNotificationPermissions,
  requestNotificationPermissions,
  registerForPushNotificationsAsync,
} from '../utils/notificationService';
import { updatePushToken } from '../services/backendService';

let nudgeShownThisSession = false;

export function useRecurringNudge() {
  async function checkAndNudge() {
    if (nudgeShownThisSession) return;

    const hasPermission = await checkNotificationPermissions();
    if (hasPermission) return;

    nudgeShownThisSession = true;

    const { status } = await Notifications.getPermissionsAsync();
    const isDenied = status === 'denied';

    if (isDenied) {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications in Settings to get reminders 3 days before your recurring transactions.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
    } else {
      Alert.alert(
        'Enable Notifications',
        'Get reminders 3 days before your recurring transactions.',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              const granted = await requestNotificationPermissions();
              if (granted) {
                const token = await registerForPushNotificationsAsync();
                if (token) await updatePushToken(token);
              }
            },
          },
        ],
      );
    }
  }

  return { checkAndNudge };
}

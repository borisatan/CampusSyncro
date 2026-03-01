import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useNotificationStore } from '../../store/useNotificationStore';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  rescheduleNotificationsIfNeeded
} from '../../utils/notificationService';

export default function NotificationInitializer() {
  const router = useRouter();
  const { frequency, loadNotificationSettings } = useNotificationStore();

  useEffect(() => {
    // Initialize notification settings
    const initNotifications = async () => {
      await loadNotificationSettings();
      const currentFrequency = useNotificationStore.getState().frequency;

      // Reschedule notifications on app launch
      await rescheduleNotificationsIfNeeded(currentFrequency);
    };

    initNotifications();

    // Set up notification listeners
    const receivedSubscription = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // Notification already filtered by smart logic in service
    });

    const responseSubscription = addNotificationResponseListener((response) => {
      console.log('Notification tapped:', response);
      // Navigate to add transaction screen when user taps notification
      router.push('/(tabs)/add-transaction');
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return null;
}

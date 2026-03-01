import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  checkHasTransactionsToday,
  fetchNotificationMessages,
  logNotification
} from '../services/backendService';

// Fixed notification times (hour of day in 24h format)
const NOTIFICATION_TIMES = [8, 10, 12, 15, 18, 20, 21]; // 8am, 10am, 12pm, 3pm, 6pm, 8pm, 9pm

// Configure default notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions from the user
 * Returns true if permission granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Physical device check
  if (!Device.isDevice) {
    console.log('Notifications only work on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return false;
  }

  // Android specific: create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('transaction-reminders', {
      name: 'Transaction Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4f46e5', // Indigo color from app theme
    });
  }

  return true;
}

/**
 * Check if app has notification permissions
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Get a random notification message from user's active messages
 */
async function getRandomNotificationMessage(): Promise<{ id: number | null; text: string }> {
  try {
    const messages = await fetchNotificationMessages();

    if (messages.length === 0) {
      // Default fallback message
      return {
        id: null,
        text: "Don't forget to log your transactions today! 💰"
      };
    }

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    return {
      id: randomMessage.id,
      text: randomMessage.message_text
    };
  } catch (error) {
    console.error('Error fetching notification messages:', error);
    return {
      id: null,
      text: "Remember to track your spending today! 📊"
    };
  }
}

/**
 * Schedule notifications based on frequency
 * frequency: number of times per day (0 = off)
 */
export async function scheduleNotifications(frequency: number): Promise<void> {
  // Cancel all existing scheduled notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (frequency === 0) {
    console.log('Notifications disabled (frequency = 0)');
    return;
  }

  if (frequency > NOTIFICATION_TIMES.length) {
    frequency = NOTIFICATION_TIMES.length;
  }

  // Get the first N times based on frequency
  const selectedTimes = NOTIFICATION_TIMES.slice(0, frequency);

  // Schedule notifications for the next 7 days
  const scheduledIds: string[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (const hour of selectedTimes) {
      const trigger = new Date();
      trigger.setDate(trigger.getDate() + dayOffset);
      trigger.setHours(hour, 0, 0, 0);

      // Only schedule future notifications
      if (trigger.getTime() > Date.now()) {
        const { id: messageId, text } = await getRandomNotificationMessage();

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Transaction Reminder',
            body: text,
            data: {
              type: 'transaction-reminder',
              messageId,
              scheduledTime: trigger.toISOString()
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger,
        });

        scheduledIds.push(notificationId);
      }
    }
  }

  console.log(`Scheduled ${scheduledIds.length} notifications`);
}

/**
 * Smart notification check - returns true if notification should be shown
 * Checks if user has logged any transactions today
 */
export async function shouldShowNotification(): Promise<boolean> {
  const hasTransactions = await checkHasTransactionsToday();
  return !hasTransactions; // Show notification only if no transactions today
}

/**
 * Handle notification received
 * This is called when notification fires (even if app is in background)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(async (notification) => {
    // Smart logic check
    const shouldShow = await shouldShowNotification();

    // Log the notification
    const data = notification.request.content.data as any;
    await logNotification({
      notification_message_id: data.messageId ?? null,
      message_text: notification.request.content.body ?? '',
      scheduled_time: new Date(data.scheduledTime ?? Date.now()),
      had_transaction_today: !shouldShow
    });

    if (shouldShow) {
      callback(notification);
    }
  });
}

/**
 * Handle notification response (user tapped on notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Reschedule notifications (call this on app launch or when frequency changes)
 */
export async function rescheduleNotificationsIfNeeded(frequency: number): Promise<void> {
  const hasPermission = await checkNotificationPermissions();

  if (!hasPermission && frequency > 0) {
    console.log('No notification permission, skipping schedule');
    return;
  }

  await scheduleNotifications(frequency);
}

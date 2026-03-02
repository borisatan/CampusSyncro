import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  checkHasTransactionsToday,
  fetchNotificationMessages,
  logNotification,
} from "../services/backendService";

// Fixed notification times (hour and minute in 24h format)
// Structured by frequency: 1x, 2x, 3x, and 5x per day
const NOTIFICATION_TIMES = [
  { hour: 20, minute: 0 }, // 1x/day: 8:00 PM
  { hour: 13, minute: 0 }, // 2x/day: 1:00 PM
  { hour: 20, minute: 0 }, // 2x/day: 8:00 PM
  { hour: 9, minute: 0 }, // 3x/day: 9:00 AM
  { hour: 13, minute: 0 }, // 3x/day: 1:00 PM (reused)
  { hour: 21, minute: 0 }, // 3x/day: 9:00 PM
  { hour: 8, minute: 30 }, // 5x/day: 8:30 AM
  { hour: 12, minute: 30 }, // 5x/day: 12:30 PM
  { hour: 15, minute: 30 }, // 5x/day: 3:30 PM
  { hour: 18, minute: 30 }, // 5x/day: 6:30 PM
  { hour: 21, minute: 30 }, // 5x/day: 9:30 PM
];

// Map frequency to actual notification times
const FREQUENCY_MAP: { [key: number]: number[] } = {
  1: [0], // 1x/day: indices [0]
  2: [1, 2], // 2x/day: indices [1, 2]
  3: [3, 4, 5], // 3x/day: indices [3, 4, 5]
  5: [6, 7, 8, 9, 10], // 5x/day: indices [6, 7, 8, 9, 10]
};

// Configure default notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
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
    console.log("Notifications only work on physical devices");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission denied");
    return false;
  }

  // Android specific: create notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("transaction-reminders", {
      name: "Transaction Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4f46e5", // Indigo color from app theme
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
  return status === "granted";
}

/**
 * Get time-contextual default messages based on hour of day
 */
function getTimeContextualMessage(hour: number): string {
  // Early morning (8:00-9:30 AM) - Morning motivation
  if (hour >= 8 && hour < 10) {
    const morningMessages = [
      "Good morning! Start your day with financial clarity ☀️",
      "New day, fresh start! Keep your finances on track today ☀️",
    ];
    return morningMessages[Math.floor(Math.random() * morningMessages.length)];
  }

  // Lunch time (12:00-1:30 PM) - Post-lunch check-in
  if (hour >= 12 && hour < 14) {
    const lunchMessages = [
      "Lunchtime reminder: Don't forget to log that meal! 🍽️",
      "Post-lunch check: Caught up on your morning transactions?",
      "Quick break? Perfect time to update your spending! ☕",
      "Midday money check - stay on top of your budget! 📊",
    ];
    return lunchMessages[Math.floor(Math.random() * lunchMessages.length)];
  }

  // Afternoon (3:00-4:00 PM) - Afternoon reminder
  if (hour >= 15 && hour < 16) {
    const afternoonMessages = [
      "Afternoon reminder: Log those coffee runs and snacks! ☕",
      "Mid-afternoon check-in: Stay on top of your budget! 📱",
      "Power through the afternoon - update your expenses! 💪",
    ];
    return afternoonMessages[
      Math.floor(Math.random() * afternoonMessages.length)
    ];
  }

  // Evening (6:00-7:00 PM) - Post-commute
  if (hour >= 18 && hour < 19) {
    const eveningMessages = [
      "Commute home? Perfect time to update your spending! 🚗",
      "Evening check: Capture those afternoon purchases! 🌆",
      "Workday's done - keep your finances up to date! 📝",
    ];
    return eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
  }

  // Night (8:00-10:00 PM) - Daily review and reconciliation
  if (hour >= 20 && hour < 23) {
    const nightMessages = [
      "Daily review: Time to reconcile today's spending! 🌙",
      "Wind down with a quick financial check-in 📊",
      "Before bed: Did you log all of today's transactions? 💤",
      "Evening reflection: Update your expenses before tomorrow! 🎯",
    ];
    return nightMessages[Math.floor(Math.random() * nightMessages.length)];
  }

  // Default fallback
  return "Don't forget to log your transactions today! 💰";
}

/**
 * Get a random notification message from user's active messages
 * Falls back to time-contextual messages if no custom messages exist
 */
async function getRandomNotificationMessage(hour: number): Promise<{
  id: number | null;
  text: string;
}> {
  try {
    const messages = await fetchNotificationMessages();

    if (messages.length === 0) {
      // Use time-contextual default message
      return {
        id: null,
        text: getTimeContextualMessage(hour),
      };
    }

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    return {
      id: randomMessage.id,
      text: randomMessage.message_text,
    };
  } catch (error) {
    console.error("Error fetching notification messages:", error);
    return {
      id: null,
      text: getTimeContextualMessage(hour),
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
    console.log("Notifications disabled (frequency = 0)");
    return;
  }

  // Get the indices for the selected frequency
  const timeIndices = FREQUENCY_MAP[frequency];

  if (!timeIndices) {
    console.log(`Invalid frequency: ${frequency}. Supported: 1, 2, 3, 5`);
    return;
  }

  // Get the selected notification times based on frequency
  const selectedTimes = timeIndices.map((index) => NOTIFICATION_TIMES[index]);

  // Schedule notifications for the next 7 days
  const scheduledIds: string[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (const time of selectedTimes) {
      const trigger = new Date();
      trigger.setDate(trigger.getDate() + dayOffset);
      trigger.setHours(time.hour, time.minute, 0, 0);

      // Only schedule future notifications
      if (trigger.getTime() > Date.now()) {
        const { id: messageId, text } = await getRandomNotificationMessage(
          time.hour,
        );

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Transaction Reminder",
            body: text,
            data: {
              type: "transaction-reminder",
              messageId,
              scheduledTime: trigger.toISOString(),
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger.getTime(),
            channelId: "transaction-reminders",
          },
        });

        scheduledIds.push(notificationId);
      }
    }
  }

  console.log(
    `Scheduled ${scheduledIds.length} notifications for frequency ${frequency}x/day`,
  );
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
  callback: (notification: Notifications.Notification) => void,
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(async (notification) => {
    // Smart logic check
    const shouldShow = await shouldShowNotification();

    // Log the notification
    const data = notification.request.content.data as any;
    await logNotification({
      notification_message_id: data.messageId ?? null,
      message_text: notification.request.content.body ?? "",
      scheduled_time: new Date(data.scheduledTime ?? Date.now()),
      had_transaction_today: !shouldShow,
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
  callback: (response: Notifications.NotificationResponse) => void,
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Reschedule notifications (call this on app launch or when frequency changes)
 */
export async function rescheduleNotificationsIfNeeded(
  frequency: number,
): Promise<void> {
  const hasPermission = await checkNotificationPermissions();

  if (!hasPermission && frequency > 0) {
    console.log("No notification permission, skipping schedule");
    return;
  }

  await scheduleNotifications(frequency);
}

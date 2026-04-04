import { create } from 'zustand';
import {
  getNotificationFrequency,
  updateNotificationFrequency,
} from '../services/backendService';
import {
  requestNotificationPermissions,
  checkNotificationPermissions,
  rescheduleNotificationsIfNeeded
} from '../utils/notificationService';
import { NotificationFrequency } from '../types/types';

interface NotificationState {
  frequency: NotificationFrequency;
  hasPermission: boolean;
  isLoading: boolean;

  // Actions
  loadNotificationSettings: () => Promise<void>;
  updateFrequency: (newFrequency: NotificationFrequency) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  checkPermissions: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  frequency: 0,
  hasPermission: false,
  isLoading: false,

  loadNotificationSettings: async () => {
    try {
      set({ isLoading: true });
      const [frequency, hasPermission] = await Promise.all([
        getNotificationFrequency(),
        checkNotificationPermissions()
      ]);

      set({
        frequency: frequency as NotificationFrequency,
        hasPermission,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading notification settings:', error);
      set({ isLoading: false });
    }
  },

  updateFrequency: async (newFrequency: NotificationFrequency) => {
    try {
      // Optimistic update
      set({ frequency: newFrequency });

      // Update backend
      await updateNotificationFrequency(newFrequency);

      // Reschedule notifications
      await rescheduleNotificationsIfNeeded(newFrequency);
    } catch (error) {
      console.error('Error updating notification frequency:', error);
      // Revert on error
      const oldFrequency = await getNotificationFrequency();
      set({ frequency: oldFrequency as NotificationFrequency });
      throw error;
    }
  },

  requestPermissions: async () => {
    const granted = await requestNotificationPermissions();
    set({ hasPermission: granted });
    return granted;
  },

  checkPermissions: async () => {
    const granted = await checkNotificationPermissions();
    set({ hasPermission: granted });
  },
}));

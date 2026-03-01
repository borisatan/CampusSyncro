import { create } from 'zustand';
import {
  getNotificationFrequency,
  updateNotificationFrequency,
  fetchNotificationMessages,
  createNotificationMessage,
  updateNotificationMessage,
  deleteNotificationMessage
} from '../services/backendService';
import {
  requestNotificationPermissions,
  checkNotificationPermissions,
  rescheduleNotificationsIfNeeded
} from '../utils/notificationService';
import { NotificationMessage, NotificationFrequency } from '../types/types';

interface NotificationState {
  frequency: NotificationFrequency;
  hasPermission: boolean;
  messages: NotificationMessage[];
  isLoading: boolean;

  // Actions
  loadNotificationSettings: () => Promise<void>;
  updateFrequency: (newFrequency: NotificationFrequency) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  checkPermissions: () => Promise<void>;

  // Message management
  loadMessages: () => Promise<void>;
  addMessage: (messageText: string) => Promise<void>;
  editMessage: (id: number, messageText: string) => Promise<void>;
  removeMessage: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  frequency: 0,
  hasPermission: false,
  messages: [],
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

  loadMessages: async () => {
    try {
      const messages = await fetchNotificationMessages();
      set({ messages });
    } catch (error) {
      console.error('Error loading notification messages:', error);
    }
  },

  addMessage: async (messageText: string) => {
    try {
      const newMessage = await createNotificationMessage(messageText);
      set((state) => ({ messages: [...state.messages, newMessage] }));
    } catch (error) {
      console.error('Error adding notification message:', error);
      throw error;
    }
  },

  editMessage: async (id: number, messageText: string) => {
    try {
      await updateNotificationMessage(id, messageText);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === id ? { ...msg, message_text: messageText } : msg
        ),
      }));
    } catch (error) {
      console.error('Error updating notification message:', error);
      throw error;
    }
  },

  removeMessage: async (id: number) => {
    try {
      await deleteNotificationMessage(id);
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting notification message:', error);
      throw error;
    }
  },
}));

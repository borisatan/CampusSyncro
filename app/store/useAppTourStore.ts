import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AppTourStoreState {
  seenPages: Record<string, boolean>;
  markPageSeen: (pageId: string) => void;
  isPageSeen: (pageId: string) => boolean;
}

export const useAppTourStore = create<AppTourStoreState>()(
  persist(
    (set, get) => ({
      seenPages: {},

      markPageSeen: (pageId) =>
        set((state) => ({ seenPages: { ...state.seenPages, [pageId]: true } })),

      isPageSeen: (pageId) => get().seenPages[pageId] === true,
    }),
    {
      name: 'app-tour-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { create } from 'zustand';

interface AppTourStoreState {
  seenPages: Record<string, boolean>;
  markPageSeen: (pageId: string) => void;
  isPageSeen: (pageId: string) => boolean;
}

export const useAppTourStore = create<AppTourStoreState>()((set, get) => ({
  seenPages: {},

  markPageSeen: (pageId) =>
    set((state) => ({ seenPages: { ...state.seenPages, [pageId]: true } })),

  isPageSeen: (pageId) => get().seenPages[pageId] === true,
}));

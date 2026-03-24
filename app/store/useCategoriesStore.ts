import { create } from 'zustand';
import { fetchCategories } from '../services/backendService';
import { Category } from '../types/types';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  loadCategories: () => Promise<void>;
  setCategories: (categories: Category[]) => void;
  addCategoryOptimistic: (category: Category) => void;
  updateCategoryOptimistic: (id: string, updates: Partial<Category>) => void;
  deleteCategoryOptimistic: (id: string) => void;
  reorderCategories: (reorderedCategories: Category[]) => void;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  isLoading: false,

  loadCategories: async () => {
    try {
      set({ isLoading: true });
      const data = await fetchCategories();
      // Sort by sort_order if available, otherwise by id
      const sorted = [...data].sort((a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      set({ categories: sorted, isLoading: false });
    } catch (error) {
      console.error('Error loading categories:', error);
      set({ isLoading: false });
    }
  },

  setCategories: (categories) => set({ categories }),

  addCategoryOptimistic: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),

  updateCategoryOptimistic: (id: string, updates) =>
    set((state) => ({
      categories: state.categories.map((cat) =>
        cat.id === id ? { ...cat, ...updates } : cat
      ),
    })),

  deleteCategoryOptimistic: (id: string) =>
    set((state) => ({
      categories: state.categories.filter((cat) => cat.id !== id),
    })),

  reorderCategories: (reorderedCategories) =>
    set({ categories: reorderedCategories }),
}));


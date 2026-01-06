import { create } from 'zustand';
import { getUserCurrency, updateUserCurrency } from '../services/backendService';
import { getCurrencySymbol, isValidCurrency, SupportedCurrency } from '../types/types';

interface CurrencyState {
  currencyCode: string | null;
  currencySymbol: string;
  isLoading: boolean;
  loadCurrency: () => Promise<void>;
  updateCurrency: (newCurrency: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currencyCode: null,
  currencySymbol: '$', // Default fallback
  isLoading: true,

  loadCurrency: async () => {
    try {
      set({ isLoading: true });
      const userCurrency = await getUserCurrency();
      
      if (userCurrency && isValidCurrency(userCurrency)) {
        const symbol = getCurrencySymbol(userCurrency as SupportedCurrency);
        set({ 
          currencyCode: userCurrency, 
          currencySymbol: symbol,
          isLoading: false 
        });
      } else {
        set({ 
          currencyCode: null, 
          currencySymbol: '',
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Error loading currency:', error);
      set({ 
        currencyCode: null, 
        currencySymbol: '$',
        isLoading: false 
      });
    }
  },

  updateCurrency: async (newCurrency: string) => {
    try {
      if (!isValidCurrency(newCurrency)) {
        throw new Error('Invalid currency code');
      }

      await updateUserCurrency(newCurrency);
      const symbol = getCurrencySymbol(newCurrency as SupportedCurrency);
      
      set({ 
        currencyCode: newCurrency, 
        currencySymbol: symbol 
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  },
}));


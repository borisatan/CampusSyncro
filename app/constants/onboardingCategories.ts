export interface OnboardingCategory {
  name: string;
  icon: string;
  color: string;
  section: 'essentials' | 'lifestyle' | 'savings';
  defaultSelected: boolean;
}

export const ONBOARDING_CATEGORIES: OnboardingCategory[] = [
  // ESSENTIALS (pre-selected by default)
  { name: 'Housing', icon: 'home', color: '#F59E0B', section: 'essentials', defaultSelected: true },
  { name: 'Utilities', icon: 'flash', color: '#FBBF24', section: 'essentials', defaultSelected: true },
  { name: 'Groceries', icon: 'cart', color: '#22C55E', section: 'essentials', defaultSelected: true },
  { name: 'Transportation', icon: 'car', color: '#3B82F6', section: 'essentials', defaultSelected: true },

  // LIFESTYLE
  { name: 'Dining Out', icon: 'restaurant', color: '#EF4444', section: 'lifestyle', defaultSelected: false },
  { name: 'Entertainment', icon: 'film', color: '#8B5CF6', section: 'lifestyle', defaultSelected: false },
  { name: 'Shopping', icon: 'bag-handle', color: '#06B6D4', section: 'lifestyle', defaultSelected: false },
  { name: 'Health & Fitness', icon: 'fitness', color: '#14B8A6', section: 'lifestyle', defaultSelected: false },
  { name: 'Personal Care', icon: 'sparkles', color: '#A855F7', section: 'lifestyle', defaultSelected: false },
];

export const EMOTION_OPTIONS = [
  { id: 'anxious', label: 'Anxious', emoji: '😰' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '😵' },
  { id: 'indifferent', label: 'Indifferent', emoji: '😐' },
  { id: 'hopeful', label: 'Hopeful', emoji: '🌱' },
] as const;

export const VALUE_OPTIONS = [
  { id: 'travel', label: 'Travel & Adventure', icon: 'airplane', color: '#3B82F6' },
  { id: 'wellness', label: 'Wellness', icon: 'heart', color: '#EF4444' },
  { id: 'home', label: 'Home Sanctuary', icon: 'home', color: '#F59E0B' },
  { id: 'savings', label: 'Future Savings', icon: 'wallet', color: '#14B8A6' },
  { id: 'social', label: 'Social Life', icon: 'people', color: '#8B5CF6' },
] as const;

export type EmotionId = typeof EMOTION_OPTIONS[number]['id'];
export type ValueId = typeof VALUE_OPTIONS[number]['id'];

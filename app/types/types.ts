export type CategoryName = 'Transport' | 'Food' | 'Education' | 'Savings' | 'Travel' | 
  'Health' | 'Care' | 'Home' | 'Personal' | 'Clothes' | 'Medical';

export interface Category {
    id: number; // Make sure this is consistently number or string across your app
    name: CategoryName;
    icon: string;
    color: string;
  }
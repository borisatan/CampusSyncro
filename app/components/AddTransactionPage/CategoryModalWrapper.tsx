import React from 'react';
import { Category } from '../../types/types';
import { CategoryModal } from '../Shared/category-modal';

interface CategoryModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onSubmit: (categories: Category[]) => void;
  editingCategory?: Category | null;
}

const CategoryModalWrapper: React.FC<CategoryModalWrapperProps> = ({
  visible,
  onClose,
  categories,
  onSubmit,
  editingCategory = null,
}) => {
  const handleSubmit = (category: Category) => {
    if (editingCategory) {
      const updatedCategories = categories.map((c) =>
        c.id === category.id ? category : c
      );
      onSubmit(updatedCategories);
    } else {
      onSubmit([...categories, category]); // <- make sure `category.id` is from Supabase
    }
    onClose();
  };

  // Fix: Add null checks and filter out null/undefined category names
  const existingCategoryNames = (categories || [])
    .map(c => c?.category_name)
    .filter(name => name != null) as string[];

  return (
    <CategoryModal
      visible={visible}
      onClose={onClose}
      onSubmit={handleSubmit}
      mode={editingCategory ? 'edit' : 'add'}
      category={editingCategory || undefined}
      existingCategories={existingCategoryNames}
    />
  );
};

export default CategoryModalWrapper;
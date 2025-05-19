import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Category, CategoryName } from "../types/types";

const sampleIcons = ['💰', '🛒', '🏠', '🎉', '📚', '🍔'];
const sampleColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}


type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (category: Category) => void;
  category: Category;
};

export const CategoryEditModal = ({ visible, onClose, onSubmit, category }: Props) => {
  const [name, setName] = useState(category.name || '');
  const [icon, setIcon] = useState(category.icon || '');
  const [color, setColor] = useState(category.color || '');

  useEffect(() => {
    setName(category.name || '');
    setIcon(category.icon || '');
    setColor(category.color || '');
  }, [category]);


  const validNames: CategoryName[] = [
    "Food", "Transport", "Health", "Education", "Savings",
    "Travel", "Care", "Home", "Personal", "Clothes", "Medical"
  ];
  
  function isValidCategoryName(value: string): value is CategoryName {
    return validNames.includes(value as CategoryName);
  }

  const handleSave = () => {
  const trimmedName = name.trim();
  if (!trimmedName || !isValidCategoryName(trimmedName)) return;

  const updatedCategory: Category = {
    ...category,
    name: trimmedName, // now guaranteed to be a CategoryName
    icon: icon || getRandomItem(sampleIcons),
    color: color || getRandomItem(sampleColors),
  };

  onSubmit(updatedCategory);
  onClose();
};

  return (
    <KeyboardAvoidingView >
    <Modal visible={visible} transparent animationType="slide" >
      <View className="flex-1 justify-end ">
        <View className="bg-white rounded-t-2xl p-6 space-y-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold">Edit Category</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} />
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View>
            <Text className="text-sm text-gray-600 mb-1">Name</Text>
            <TextInput
              value={name}
              onChangeText={(text) => setName(text as CategoryName)}
              placeholder="Enter category name"
              className="border border-gray-300 rounded-xl px-4 py-2"
            />
          </View>

          {/* Icon Picker */}
          <View>
            <Text className="text-sm text-gray-600 mb-1">Icon</Text>
            <FlatList
              horizontal
              data={sampleIcons}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setIcon(item)}
                  className={`p-2 rounded-xl mr-2 border ${
                    icon === item ? 'border-blue-500' : 'border-gray-300'
                  }`}
                >
                  <Text className="text-2xl">{item}</Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* Color Picker */}
          <View>
            <Text className="text-sm text-gray-600 mb-1">Color</Text>
            <FlatList
              horizontal
              data={sampleColors}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setColor(item)}
                  className={`w-10 h-10 rounded-full mr-2 border-2 ${
                    color === item ? 'border-black' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: item }}
                />
              )}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!name.trim()}
            className={`bg-blue-600 rounded-xl py-3 ${
              !name.trim() ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-white text-center font-semibold">Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </KeyboardAvoidingView>
  );
};
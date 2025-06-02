import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Category, CategoryName } from '../types/types';

interface CategoryModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (category: Category) => void;
    mode: 'add' | 'edit';
    category?: Category;
    existingCategories?: string[];
}

// Available icons for categories
const availableIcons = [
    'restaurant', 'bus', 'film', 'flash', 'cart', 'medkit', 'school',
    'wallet', 'home', 'shield-checkmark', 'airplane', 'person',
    'gift', 'cafe', 'car', 'bicycle', 'train', 'subway',
    'basketball', 'football', 'tennisball', 'fitness', 'barbell',
    'book', 'library', 'newspaper', 'pencil', 'calculator',
    'card', 'cash', 'pricetag', 'pricetags', 'receipt',
    'shirt', 'bag', 'glasses', 'watch', 'diamond',
    'wine', 'beer', 'pizza', 'ice-cream', 'nutrition'
];

// Predefined colors for categories
const categoryColors = [
    '#F94144', '#F3722C', '#F8961E', '#F9C74F', '#90BE6D',
    '#43AA8B', '#4D908E', '#577590', '#277DA1', '#8338EC',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
    '#E74C3C', '#1ABC9C', '#F1C40F', '#34495E', '#16A085'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
    visible,
    onClose,
    onSubmit,
    mode,
    category,
    existingCategories = [],
}) => {
    const [categoryName, setCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(availableIcons[0]);
    const [selectedColor, setSelectedColor] = useState(categoryColors[0]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && category) {
            setCategoryName(category.name);
            setSelectedIcon(category.icon);
            setSelectedColor(category.color);
        }
    }, [mode, category]);

    const handleSubmit = () => {
        if (!categoryName.trim()) {
            setError('Please enter a category name');
            return;
        }

        if (mode === 'add' && existingCategories?.includes(categoryName.trim())) {
            setError('This category already exists');
            return;
        }

        onSubmit({
            id: category?.id || Date.now(),
            name: categoryName.trim() as CategoryName,
            icon: selectedIcon,
            color: selectedColor,
        });

        // Reset form if in add mode
        if (mode === 'add') {
            setCategoryName('');
            setSelectedIcon(availableIcons[0]);
            setSelectedColor(categoryColors[0]);
        }
        setError('');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-end"
            >
                <TouchableOpacity
                    className="flex-1"
                    activeOpacity={1}
                    onPress={() => {
                        Keyboard.dismiss();
                        onClose();
                    }}
                >
                    <View className="flex-1 justify-end">
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            className="bg-[#FFFFFF] dark:bg-[#1E1E1E] rounded-t-3xl p-6"
                        >
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-[#212121] dark:text-[#FFFFFF]">
                                    {mode === 'add' ? 'Add Custom Category' : 'Edit Category'}
                                </Text>
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="p-2"
                                >
                                    <Ionicons name="close" size={24} color="#5F6368" />
                                </TouchableOpacity>
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF] mb-2">
                                    Category Name
                                </Text>
                                <TextInput
                                    className="bg-[#FAFAFA] dark:bg-[#282A36] border border-[#E0E0E0] dark:border-[#2C2C2C] rounded-xl px-4 py-3 text-[#212121] dark:text-[#FFFFFF]"
                                    placeholder="Enter category name"
                                    placeholderTextColor="#9E9E9E"
                                    value={categoryName}
                                    maxLength={50}
                                    onChangeText={(text) => {
                                        setCategoryName(text);
                                        setError('');
                                    }}
                                />
                                <View className="flex-row justify-between mt-1">
                                    {error ? (
                                        <Text className="text-[#E53935] dark:text-[#EF5350] text-sm">
                                            {error}
                                        </Text>
                                    ) : (
                                        <View />
                                    )}
                                    <Text className="text-[#9E9E9E] text-sm">
                                        {categoryName.length}/50
                                    </Text>
                                </View>
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF] mb-2">
                                    Select Icon
                                </Text>
                                <View className="gap-2">
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        className="mb-2"
                                    >
                                        <View className="flex-row gap-2">
                                            {availableIcons.slice(0, Math.ceil(availableIcons.length / 2)).map((icon) => (
                                                <TouchableOpacity
                                                    key={icon}
                                                    className={`w-12 h-12 rounded-xl items-center justify-center`}
                                                    style={{
                                                        backgroundColor: selectedIcon === icon ? selectedColor : '#E0E0E0'
                                                    }}
                                                    onPress={() => setSelectedIcon(icon)}
                                                >
                                                    <Ionicons
                                                        name={icon as any}
                                                        size={24}
                                                        color={selectedIcon === icon ? 'white' : '#212121'}
                                                    />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        className="mb-2"
                                    >
                                        <View className="flex-row gap-2">
                                            {availableIcons.slice(Math.ceil(availableIcons.length / 2)).map((icon) => (
                                                <TouchableOpacity
                                                    key={icon}
                                                    className={`w-12 h-12 rounded-xl items-center justify-center`}
                                                    style={{
                                                        backgroundColor: selectedIcon === icon ? selectedColor : '#E0E0E0'
                                                    }}
                                                    onPress={() => setSelectedIcon(icon)}
                                                >
                                                    <Ionicons
                                                        name={icon as any}
                                                        size={24}
                                                        color={selectedIcon === icon ? 'white' : '#212121'}
                                                    />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>

                            <View className="mb-6">
                                <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF] mb-2">
                                    Select Color
                                </Text>
                                <View className="gap-2">
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        className="mb-2"
                                    >
                                        <View className="flex-row gap-2">
                                            {categoryColors.slice(0, Math.ceil(categoryColors.length / 2)).map((color) => (
                                                <TouchableOpacity
                                                    key={color}
                                                    className={`w-12 h-12 rounded-xl ${
                                                        selectedColor === color
                                                            ? 'border-2 border-[#2A9D8F]'
                                                            : ''
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                    onPress={() => setSelectedColor(color)}
                                                />
                                            ))}
                                        </View>
                                    </ScrollView>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        className="mb-2"
                                    >
                                        <View className="flex-row gap-2">
                                            {categoryColors.slice(Math.ceil(categoryColors.length / 2)).map((color) => (
                                                <TouchableOpacity
                                                    key={color}
                                                    className={`w-12 h-12 rounded-xl ${
                                                        selectedColor === color
                                                            ? 'border-2 border-[#2A9D8F]'
                                                            : ''
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                    onPress={() => setSelectedColor(color)}
                                                />
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>

                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    className="flex-1 bg-[#E0E0E0] dark:bg-[#2C2C2C] py-3 rounded-xl"
                                    onPress={onClose}
                                >
                                    <Text className="text-[#212121] dark:text-[#FFFFFF] font-semibold text-center">
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    className="flex-1 bg-[#2A9D8F] py-3 rounded-xl"
                                    onPress={handleSubmit}
                                >
                                    <Text className="text-white font-semibold text-center">
                                        {mode === 'add' ? 'Add Category' : 'Save Changes'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
}; 


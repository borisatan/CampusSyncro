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
import { supabase } from '../../../app/utils/supabase';
import { Category } from '../../types/types';

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
    "#FF9999","#FF6666","#FF3333","#CC0000","#990000",
"#FFB366","#FF9933","#FF8000","#CC6600","#994C00",
"#FFFF66","#FFEB33","#FFCC00","#CCCC00","#999900",
"#B3FF66","#99FF33","#66CC00","#4C9900","#336600",
"#66FF66","#33CC33","#009933","#006600","#004C00",
"#66FFB3","#33FF99","#00CC66","#00994C","#006633",
"#66FFFF","#33CCFF","#0099FF","#0066CC","#004C99",
"#99CCFF","#6699FF","#3366FF","#0033CC","#001966",
"#B366FF","#9933FF","#7F00CC","#4C0099","#330066",
"#FF66B2","#FF3399","#FF007F","#CC0066","#800040",
"#FF99CC","#FF66CC","#FF33CC","#CC0099","#990073",
"#FFD966","#FFCC33","#FFB300","#CC9900","#996600",
"#D9B38C","#CC9966","#B37700","#996633","#663300",
"#E6E6E6","#CCCCCC","#B3B3B3","#808080","#4D4D4D",
"#C2C2A3","#999966","#80804D","#666633","#4D4D26",
"#99E6E6","#66CCCC","#33B2B2","#008080","#004C4C",
"#99FF99","#66FF80","#33CC66","#00994D","#006633",
"#CCE6FF","#99CCFF","#66B2FF","#3380CC","#0059B2",
"#E699FF","#CC66FF","#B233CC","#8000B2","#4D0073"




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
            setCategoryName(category.category_name.trim());
            setSelectedIcon(category.icon);
            setSelectedColor(category.color);
        }
    }, [mode, category]);

    const handleSubmit = async () => {
        if (!categoryName.trim()) {
          setError('Please enter a category name');
          return;
        }
      
        if (mode === 'add' && existingCategories?.includes(categoryName.trim())) {
          setError('This category already exists');
          return;
        }
      
        try {
          const newCategory = {
            category_name: categoryName.trim(),
            icon: selectedIcon,
            color: selectedColor,
          };
          
          if (mode === 'edit' && category) {
              const { data, error } = await supabase
              .from('Categories')
              .update(newCategory)
              .eq('id', category.id)
              .select()
              .single();
              
              if (error) throw error;
              
              onSubmit({ ...category, ...newCategory }); // update locally
            } else {
                console.log(newCategory);
                const { data, error } = await supabase
              .from('Categories')
              .insert(newCategory)
              .select()
              .single();
      
            if (error) throw error;
      
            onSubmit(data); // add new one locally with ID from Supabase
          }
      
          // Reset form if in add mode
          if (mode === 'add') {
            setCategoryName('');
            setSelectedIcon(availableIcons[0]);
            setSelectedColor(categoryColors[0]);
          }
      
          setError('');
        } catch (err) {
          console.error('Error saving category:', err);
          setError('Failed to save category. Please try again.');
        }
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
                    className="bg-background dark:bg-inputDark rounded-t-3xl max-h-[80%]">

                    <ScrollView
                    className="p-6"
                    contentContainerStyle={{ paddingBottom: 50 }}
                    keyboardShouldPersistTaps="handled">

                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-textLight dark:text-textDark">
                                {mode === 'add' ? 'Add Custom Category' : 'Edit Category'}
                            </Text>
                            <TouchableOpacity onPress={onClose} className="p-2">
                                <Ionicons name="close" size={24} color="#5F6368" />
                            </TouchableOpacity>
                        </View>
    
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-textLight dark:text-textDark mb-2">
                                Category Name
                            </Text>
                            <TextInput
                                className="bg-backgroundMuted dark:bg-inputDark border border-borderLight dark:border-borderDark rounded-xl px-4 py-3 text-textLight dark:text-textDark"
                                placeholder="Enter category name"
                                placeholderTextColor={Platform.OS === "ios" ? "#888888" : "#AAAAAA"}
                                value={categoryName}
                                maxLength={50}
                                onChangeText={(text) => {
                                    setCategoryName(text);
                                    setError('');
                                }}
                            />
                            <View className="flex-row justify-between mt-1">
                                {error ? (
                                    <Text className="text-accentRed dark:text-darkRed text-sm">
                                        {error}
                                    </Text>
                                ) : (
                                    <View />
                                )}
                                <Text className="text-secondaryLight dark:text-secondaryDark text-sm">
                                    {categoryName.length}/50
                                </Text>
                            </View>
                        </View>
    
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-textLight dark:text-textDark mb-2">
                                Select Icon
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View className="flex-col gap-2">
                                    <View className="flex-row gap-2">
                                        {availableIcons.slice(0, Math.ceil(availableIcons.length / 2)).map((icon) => (
                                            <TouchableOpacity
                                                key={icon}
                                                className={`w-12 h-12 rounded-xl items-center justify-center`}
                                                style={{
                                                    backgroundColor: selectedIcon === icon ? selectedColor : '#D1D5DB' 
                                                }}
                                                onPress={() => setSelectedIcon(icon)}
                                            >
                                                <Ionicons
                                                    name={icon as any}
                                                    size={24}
                                                    color={selectedIcon === icon ? 'white' : '#4B5563'} 
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
    
                                    <View className="flex-row gap-2">
                                        {availableIcons.slice(Math.ceil(availableIcons.length / 2)).map((icon) => (
                                            <TouchableOpacity
                                                key={icon}
                                                className={`w-12 h-12 rounded-xl items-center justify-center`}
                                                style={{
                                                    backgroundColor: selectedIcon === icon ? selectedColor : '#D1D5DB'
                                                }}
                                                onPress={() => setSelectedIcon(icon)}
                                            >
                                                <Ionicons
                                                    name={icon as any}
                                                    size={24}
                                                    color={selectedIcon === icon ? 'white' : '#4B5563'}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
    
                        <View className="mb-6">
                            <Text className="text-sm font-medium text-textLight dark:text-textDark mb-2">
                                Select Color
                            </Text>
                            <ScrollView
    horizontal
    nestedScrollEnabled
    showsHorizontalScrollIndicator={true}
    contentContainerStyle={{
      paddingVertical: 8,
      paddingHorizontal: 4,
      alignItems: "center",
    }}
    style={{ maxHeight: 280 }}
  >
    {/* Each column represents a color family (5 shades stacked vertically) */}
    {Array.from({ length: Math.ceil(categoryColors.length / 5) }).map((_, colIndex) => (
      <View key={colIndex} className="flex-col items-center mx-1.5">
        {categoryColors
          .slice(colIndex * 5, colIndex * 5 + 5)
          .map((colorName) => (
            <TouchableOpacity
              key={colorName}
              className={`w-11 h-11 rounded-lg mb-1.5 ${
                selectedColor === colorName ? "border-2 border-accentTeal" : ""
              }`}
              style={{ backgroundColor: colorName }}
              onPress={() => setSelectedColor(colorName)}
            />
          ))}
      </View>
    ))}
  </ScrollView>
                        </View>
    
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                className="flex-1 bg-backgroundMuted dark:bg-inputDark py-3 border border-borderLight dark:border-borderDark rounded-xl"
                                onPress={onClose}
                            >
                                <Text className="text-textLight dark:text-textDark font-semibold text-center">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                className="flex-1 bg-accentTeal py-3 rounded-xl"
                                onPress={handleSubmit}
                            >
                                <Text className="text-textDark font-semibold text-center">
                                    {mode === 'add' ? 'Add Category' : 'Save Changes'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    </Modal>
    
    );
}; 


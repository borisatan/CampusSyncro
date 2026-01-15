import { Check, ChevronDown, ChevronUp, Palette } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedColorPicker, {
  HueSlider,
  Panel1,
  type ColorPickerRef,
} from 'reanimated-color-picker';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  isDarkMode?: boolean;
}

const PRESET_COLORS = [
  '#0EA5E9', // Sky Blue
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#6B7280', // Gray
  '#1F2937', // Dark Gray
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  isDarkMode = true,
}) => {
  const colorPickerRef = useRef<ColorPickerRef>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Check if selected color is a custom color (not in presets)
  const isCustomColor = !PRESET_COLORS.some(
    (c) => c.toUpperCase() === selectedColor.toUpperCase()
  );

  const handleColorComplete = ({ hex }: { hex: string }) => {
    onColorSelect(hex);
  };

  const handleSwatchSelect = (color: string) => {
    onColorSelect(color);
    colorPickerRef.current?.setColor(color);
  };

  return (
    <View style={{ marginBottom: 24 }}>
      {/* Quick access preset colors with check indicator */}
      <Text style={{ fontSize: 14, marginBottom: 12, color: isDarkMode ? '#94a3b8' : '#4b5563' }}>
        Color
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {PRESET_COLORS.map((color) => {
          const isSelected = selectedColor.toUpperCase() === color.toUpperCase();
          return (
            <Pressable
              key={color}
              onPress={() => handleSwatchSelect(color)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: isSelected ? 2.5 : 1,
                borderColor: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
              }}
            >
              {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
            </Pressable>
          );
        })}
      </View>

      {/* Custom Color Toggle Button */}
      <TouchableOpacity
        onPress={() => setShowCustomPicker(!showCustomPicker)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          backgroundColor: isDarkMode ? '#1e293b' : '#f3f4f6',
          marginBottom: showCustomPicker ? 12 : 0,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Palette size={18} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
          <Text style={{ fontSize: 14, color: isDarkMode ? '#94a3b8' : '#4b5563' }}>
            Custom Color
          </Text>
          {isCustomColor && (
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: selectedColor,
                borderWidth: 2,
                borderColor: isDarkMode ? '#334155' : '#d1d5db',
              }}
            />
          )}
        </View>
        {showCustomPicker ? (
          <ChevronUp size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
        ) : (
          <ChevronDown size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
        )}
      </TouchableOpacity>

      {/* Custom Color Picker (hidden by default) */}
      {showCustomPicker && (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ReanimatedColorPicker
            ref={colorPickerRef}
            value={selectedColor}
            onCompleteJS={handleColorComplete}
            sliderThickness={25}
            thumbSize={24}
            thumbShape="circle"
            boundedThumb
            style={{ gap: 12 }}
          >
            {/* Color panel for saturation/brightness */}
            <Panel1
              style={{
                height: 120,
                borderRadius: 12,
              }}
            />

            {/* Hue slider */}
            <HueSlider
              style={{
                borderRadius: 12,
              }}
            />
          </ReanimatedColorPicker>
        </GestureHandlerRootView>
      )}
    </View>
  );
};

export { PRESET_COLORS };

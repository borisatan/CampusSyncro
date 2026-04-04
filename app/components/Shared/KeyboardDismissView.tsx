import React from 'react';
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native';

interface KeyboardDismissViewProps {
  children: React.ReactNode;
  style?: object;
}

export function KeyboardDismissView({ children, style }: KeyboardDismissViewProps) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </TouchableWithoutFeedback>
  );
}

import {
  Text as RNText,
  TextInput as RNTextInput,
  TextProps,
  TextInputProps,
} from 'react-native';

export function Text({ style, ...props }: TextProps) {
  return <RNText style={[{ fontFamily: 'Inter' }, style as any]} {...props} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <RNTextInput style={[{ fontFamily: 'Inter' }, style as any]} {...props} />;
}

import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { isDarkMode } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
      className="bg-white dark:bg-[#0A0F1F]"
    >
      <View className="w-full max-w-md p-5">
        {/* Title */}
        <View className="items-center mb-8">
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2">
            Create an Account
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Sign up to get started
          </Text>
        </View>

        {/* Input Fields */}
        <View className="gap-y-3">
          <TextInput
            className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg px-4 text-gray-900 dark:text-gray-200 bg-transparent"
            placeholder="Email address"
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg px-4 text-gray-900 dark:text-gray-200 bg-transparent"
            placeholder="Password"
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg px-4 text-gray-900 dark:text-gray-200 bg-transparent"
            placeholder="Confirm Password"
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity className="bg-blue-900 dark:bg-blue-600 p-3 rounded-lg items-center">
            <Text className="text-white text-sm font-semibold">Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Link to Sign In */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-600 dark:text-gray-400 text-sm">
            Already have an account?{' '}
          </Text>
          <Link href="./sign-in" className="text-blue-900 dark:text-blue-400 text-sm font-semibold">
            Sign in
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;

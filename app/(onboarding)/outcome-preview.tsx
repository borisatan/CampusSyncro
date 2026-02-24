import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardSkeleton } from '../components/HomePage/DashboardSkeleton';
import { useOnboardingStore } from '../store/useOnboardingStore';

export default function OutcomePreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboardingStore();

  const handleContinue = () => {
    router.push('/(onboarding)/monthly-target');
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View className="flex-1 bg-[#0F172A]">
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        className="absolute inset-0"
      />

      <View
        className="absolute top-0 right-0 z-10 px-6"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.7}
          className="bg-accentBlue px-8 py-3 rounded-full"
        >
          <Text className="text-white text-base font-semibold">Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
        }}
      >
        {/* Dashboard Preview */}
        <DashboardSkeleton isDarkMode={true} />
      </ScrollView>

      {/* Bottom Content */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="items-center mb-6">
          <Text className="text-3xl text-white font-light text-center mb-3">
            See exactly where your money goes.
          </Text>
          <Text className="text-base text-slate-400 text-center">
            Build your personal dashboard in under 60 seconds.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          className="bg-accentBlue rounded-xl py-4 px-6 items-center active:opacity-80"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-semibold">
            Build My Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

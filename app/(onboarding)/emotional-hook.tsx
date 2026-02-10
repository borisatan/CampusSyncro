import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmotionButton from '../components/OnboardingPage/EmotionButton';
import OnboardingHeader from '../components/OnboardingPage/OnboardingHeader';
import { EMOTION_OPTIONS, EmotionId } from '../constants/onboardingCategories';
import { useOnboardingStore } from '../store/useOnboardingStore';

export default function EmotionalHookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId | null>(null);
  const { setOnboardingStep, completeOnboarding } = useOnboardingStore();

  useEffect(() => {
    setOnboardingStep(1);
  }, []);

  const handleContinue = () => {
    router.push('/(onboarding)/value-alignment');
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View className="flex-1 bg-backgroundDark">
      <OnboardingHeader
        currentStep={1}
        title="Money is more than just math."
        subtitle="How does your current financial situation make you feel?"
        showBack={false}
      />

      {/* Emotion Buttons */}
      <View className="flex-1 px-2 mt-8">
        {EMOTION_OPTIONS.map((option, index) => (
          <EmotionButton
            key={option.id}
            emoji={option.emoji}
            label={option.label}
            isSelected={selectedEmotion === option.id}
            onPress={() => setSelectedEmotion(option.id)}
            index={index}
          />
        ))}
      </View>

      {/* Footer */}
      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-2">
        <Text className="text-secondaryDark text-sm text-center mb-4">
          Your answer helps us tailor your experience.
        </Text>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedEmotion}
          activeOpacity={0.8}
          className={`
            w-full py-4 rounded-xl items-center border
            ${selectedEmotion ? 'bg-accentBlue border-accentBlue' : 'bg-borderDark border-borderDark'}
          `}
        >
          <Text className={`text-base font-semibold ${selectedEmotion ? 'text-white' : 'text-secondaryDark'}`}>
            Continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} className="mt-4">
          <Text className="text-secondaryDark text-sm text-center underline">
            Skip onboarding
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

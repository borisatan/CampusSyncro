import { ChevronLeft } from 'lucide-react-native';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { OnboardingTransactionHero } from '../components/OnboardingPage/OnboardingTransactionHero';
import { OnboardingCategoryGrid } from '../components/OnboardingPage/OnboardingCategoryGrid';
import { SuccessModal } from '../components/Shared/SuccessModal';

export default function PracticeEntryScreen() {
  const { setOnboardingStep, newOnboardingData, setNewOnboardingData } = useOnboardingStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  // Get autopilot categories from Screen 2
  const autopilotCategories = newOnboardingData.selectedAutopilotCategories || [];
  const [selectedCategory, setSelectedCategory] = useState<string>(autopilotCategories[0] || '');

  useEffect(() => {
    setOnboardingStep(6);
    // Auto-focus on amount input
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 500);
  }, []);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount === 5 || numAmount === 5.0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      setNewOnboardingData({ practiceEntryCompleted: true });
    }
  };

  const handleSuccessModalDismiss = () => {
    setShowSuccess(false);
    setOnboardingStep(7);
    router.push('/(onboarding)/subscription-trial');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(5);
    router.push('/(onboarding)/why-manual');
  };

  const isComplete = amount === '5' || amount === '5.00' || amount === '5.0';

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* Progress Bar */}
          <View className="px-2 pt-12 pb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Pressable
                onPress={handleBack}
                className="flex-row items-center gap-1 active:opacity-60"
              >
                <ChevronLeft size={20} color="#8A96B4" />
                <Text className="text-secondaryDark text-sm">Back</Text>
              </Pressable>
              <Text className="text-secondaryDark text-sm">Step 6 of 7</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.replace('/(tabs)/dashboard');
                }}
                className="active:opacity-60"
              >
                <Text className="text-accentBlue text-sm font-medium">Skip</Text>
              </Pressable>
            </View>
            <View className="h-1 bg-surfaceDark rounded-full overflow-hidden">
              <MotiView
                from={{ width: '71.4%' }}
                animate={{ width: '85.7%' }}
                transition={{ type: 'timing', duration: 500 }}
                className="h-full overflow-hidden relative"
              >
                <LinearGradient
                  colors={["#1E40AF", "#3B7EFF", "#60A5FA"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ width: "100%", height: "100%" }}
                />
                <MotiView
                  from={{ translateX: -200 }}
                  animate={{ translateX: 200 }}
                  transition={{
                    type: "timing",
                    duration: 3000,
                    loop: true,
                    repeatDelay: 1500,
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: 100,
                  }}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0)",
                      "rgba(255, 255, 255, 0.3)",
                      "rgba(255, 255, 255, 0)",
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ width: "100%", height: "100%" }}
                  />
                </MotiView>
              </MotiView>
            </View>
          </View>

          <View className="flex-1 px-2 py-8 pt-4">
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 600 }}
            >
              {/* Task heading */}
              <View className="text-center mb-6">
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 200, duration: 600 }}
                >
                  <Text className="text-secondaryDark text-sm mb-2 text-center">
                    Practice Entry
                  </Text>
                  <Text className="text-2xl text-white text-center">
                    Log a <Text className="text-accentGreen">$5.00 Coffee</Text>
                  </Text>
                </MotiView>
              </View>

              {/* Amount input */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300, duration: 600 }}
              >
                <OnboardingTransactionHero
                  amount={amount}
                  setAmount={setAmount}
                  isDarkMode={true}
                  amountInputRef={amountInputRef}
                />
              </MotiView>

              {/* Description field */}
              {!showSuccess && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 400, duration: 600 }}
                  className="mb-6"
                >
                  <Text className="text-sm text-slate300 mb-2">
                    Note (optional)
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add a note"
                    placeholderTextColor="#475569"
                    className="w-full px-4 py-3 rounded-xl bg-inputDark border border-borderDark text-textDark"
                  />
                </MotiView>
              )}

              {/* Category Grid */}
              {!showSuccess && autopilotCategories.length > 0 && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 500, duration: 600 }}
                >
                  <OnboardingCategoryGrid
                    categories={autopilotCategories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    isDarkMode={true}
                  />
                </MotiView>
              )}

              {/* Submit button */}
              {!showSuccess && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 600, duration: 500 }}
                >
                  <Pressable
                    onPress={handleSubmit}
                    disabled={!isComplete}
                    className={`w-full py-4 rounded-xl ${
                      isComplete
                        ? 'bg-accentRed active:opacity-80'
                        : 'bg-surfaceDark border border-borderDark'
                    }`}
                    android_ripple={
                      isComplete
                        ? { color: 'rgba(255, 255, 255, 0.1)' }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-lg text-center font-medium ${
                        isComplete ? 'text-white' : 'text-secondaryDark'
                      }`}
                    >
                      Add Transaction
                    </Text>
                  </Pressable>
                </MotiView>
              )}
            </MotiView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccess}
        text="Transaction Added!"
        onDismiss={handleSuccessModalDismiss}
      />
    </SafeAreaView>
  );
}

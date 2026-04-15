import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { MotiView } from "moti";
import React, { useEffect } from "react";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useLock } from "../../context/LockContext";

type AuthMethod = "device" | "password";

export default function AppLockScreen() {
  const { isLocked, unlock, unlockWithCredentials, deviceAuthAvailable } =
    useLock();

  const [authMethod, setAuthMethod] = useState<AuthMethod>("device");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 0 = device/biometric, 1 = password
  const progress = useSharedValue(0);

  // Load saved email for convenience
  useEffect(() => {
    const loadEmail = async () => {
      const storedEmail = await SecureStore.getItemAsync("email");
      if (storedEmail) setEmail(storedEmail);
    };
    loadEmail();
  }, []);

  // Set default auth method based on availability
  useEffect(() => {
    if (deviceAuthAvailable) {
      setAuthMethod("device");
      progress.value = withTiming(0, { duration: 150 });
    } else {
      setAuthMethod("password");
      progress.value = withTiming(1, { duration: 150 });
    }
  }, [deviceAuthAvailable]);

  // Auto-prompt for device authentication when lock screen appears
  useEffect(() => {
    if (isLocked && deviceAuthAvailable && authMethod === "device") {
      const timer = setTimeout(() => {
        unlock();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLocked, deviceAuthAvailable, authMethod, unlock]);

  const handleSetAuthMethod = (method: AuthMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAuthMethod(method);
    progress.value = withTiming(method === "password" ? 1 : 0, {
      duration: 150,
    });
  };

  const handlePasswordSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }
    setIsSubmitting(true);
    const success = await unlockWithCredentials(email, password);
    if (!success) {
      Alert.alert("Authentication Failed", "Invalid email or password.");
    }
    setIsSubmitting(false);
  };

  // Slider animated styles
  const sliderStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 50}%`,
    backgroundColor: "#3B82F6", // accentBlue
  }));

  const biometricTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], ["#ffffff", "#94a3b8"]),
  }));

  const passwordTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], ["#94a3b8", "#ffffff"]),
  }));

  if (!isLocked) {
    return null;
  }

  return (
    <View className="absolute inset-0 bg-backgroundDark z-[9999]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-6">
          {/* App Icon/Logo */}
          <View className="w-24 h-24 rounded-3xl items-center justify-center mb-6">
            <Image
              source={require("../../../assets/icons/logo-gray-300.png")}
              style={{ width: 140, height: 140 }}
              resizeMode="contain"
            />
          </View>

          {/* Lock Message */}
          <Text className="text-secondaryDark text-base mb-8">
            Your finances are locked
          </Text>

          {/* Auth Method Slider — only show if both methods available */}
          {deviceAuthAvailable && (
            <View
              className="bg-inputDark border border-borderDark rounded-2xl flex-row mb-6 w-full"
              style={{ overflow: "hidden" }}
            >
              {/* Animated sliding indicator */}
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: "50%",
                    borderRadius: 12,
                  },
                  sliderStyle,
                ]}
              />

              {/* Biometric tab */}
              <TouchableOpacity
                onPress={() => handleSetAuthMethod("device")}
                className="flex-1 py-3 rounded-xl z-10"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Ionicons
                    name="finger-print"
                    size={18}
                    color={authMethod === "device" ? "#fff" : "#94a3b8"}
                  />
                  <Animated.Text
                    style={[{ fontWeight: "500" }, biometricTextStyle]}
                  >
                    Biometric
                  </Animated.Text>
                </View>
              </TouchableOpacity>

              {/* Password tab */}
              <TouchableOpacity
                onPress={() => handleSetAuthMethod("password")}
                className="flex-1 py-3 rounded-xl z-10"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Ionicons
                    name="mail"
                    size={18}
                    color={authMethod === "password" ? "#fff" : "#94a3b8"}
                  />
                  <Animated.Text
                    style={[{ fontWeight: "500" }, passwordTextStyle]}
                  >
                    Password
                  </Animated.Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Device Auth content */}
          {authMethod === "device" && (
            <MotiView
              key="auth-device"
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 250 }}
              style={{ width: "100%", alignItems: "center" }}
            >
              <Pressable
                onPress={unlock}
                className="bg-accentBlue px-8 py-4 rounded-2xl flex-row items-center gap-3"
              >
                <Ionicons name="finger-print" size={24} color="white" />
                <Text className="text-white font-semibold text-lg">Unlock</Text>
              </Pressable>
              <Text className="text-secondaryDark text-sm mt-4 text-center">
                Authenticate with fingerprint, Face ID, or your device PIN
              </Text>
            </MotiView>
          )}

          {/* Password Auth content */}
          {authMethod === "password" && (
            <MotiView
              key="auth-password"
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 250 }}
              style={{ width: "100%" }}
            >
              <Text className="text-white mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 mb-4"
              />

              <Text className="text-white mb-2">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#64748b"
                secureTextEntry
                autoCapitalize="none"
                className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
              />

              <MotiView
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 250, delay: 80 }}
              >
                <Pressable
                  onPress={handlePasswordSubmit}
                  disabled={isSubmitting}
                  className={`mt-4 py-4 rounded-xl items-center ${
                    isSubmitting ? "bg-slate-700" : "bg-accentBlue"
                  }`}
                >
                  <Text className="text-white font-semibold">
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </Text>
                </Pressable>
              </MotiView>
            </MotiView>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

import LottieView from "lottie-react-native";
import React, { useEffect } from "react";
import { Modal, Text, View } from "react-native";

interface SuccessModalProps {
  visible: boolean;
  text: string;
  duration?: number;
  animationSpeed?: number;
  onDismiss?: () => void;
}

export const SuccessModal = ({
  visible,
  text,
  duration = 1080,
  animationSpeed = 1.2,
  onDismiss,
}: SuccessModalProps) => {
  useEffect(() => {
    if (visible && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/70">
        <View className="bg-surface rounded-3xl p-6 items-center">
          <LottieView
            source={require("../../../assets/animations/success.json")}
            autoPlay
            speed={animationSpeed}
            loop={false}
            style={{ width: 280, height: 280 }}
          />
          <Text className="text-textDark text-lg font-semibold mt-2">
            {text}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

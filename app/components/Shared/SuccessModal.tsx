import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
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
  duration = 2500,
  animationSpeed = 1.2,
  onDismiss,
}: SuccessModalProps) => {
  const animationRef = useRef<LottieView>(null);
  const onDismissRef = useRef(onDismiss);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playStartedAtRef = useRef<number>(0);

  // Keep ref updated with latest callback
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (visible) {
      animationRef.current?.reset();
      animationRef.current?.play();
      playStartedAtRef.current = Date.now();

      // Fallback timer in case onAnimationFinish doesn't fire
      timerRef.current = setTimeout(() => {
        onDismissRef.current?.();
      }, duration);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, duration]);

  const handleAnimationFinish = () => {
    // On Android, onAnimationFinish can fire immediately after reset() before
    // the animation has actually played. Guard against this by ignoring the
    // event if it fires too soon after play() was called.
    if (Date.now() - playStartedAtRef.current < 500) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onDismissRef.current?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-backgroundDark">
        <View className="items-center">
          <LottieView
            ref={animationRef}
            source={require("../../../assets/animations/success.json")}
            speed={animationSpeed}
            loop={false}
            autoPlay={false}
            onAnimationFinish={handleAnimationFinish}
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

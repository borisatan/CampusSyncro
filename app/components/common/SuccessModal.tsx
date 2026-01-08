import LottieView from 'lottie-react-native';
import React from 'react';
import { Modal, Text, View } from 'react-native';

interface SuccessModalProps {
  visible: boolean;
  text: string;
}

export const SuccessModal = ({ visible, text }: SuccessModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="bg-surfaceDark border border-borderDark rounded-3xl p-8 flex flex-col items-center shadow-xl">
          <LottieView
            source={require('../../../assets/animations/success.json')}
            autoPlay
            speed={0.85}
            loop={false}
            style={{ width: 180, height: 180 }}
          />
          <Text className="text-textDark text-lg font-semibold mt-2">
            {text}
          </Text>
        </View>
      </View>
    </Modal>
  );
};


import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useGuestWritePrompt = () => {
  const { isGuest } = useAuth();
  const [visible, setVisible] = useState(false);

  const guardWrite = (action: () => void) => {
    if (isGuest) {
      setVisible(true);
      return;
    }
    action();
  };

  return { visible, setVisible, guardWrite };
};

import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType>({ isDarkMode: true });

// Rename the exported component
export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const isDarkMode = true;

  return (
    <ThemeContext.Provider value={{ isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

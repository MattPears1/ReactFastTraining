import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  console.log('🎨 [THEME] ThemeProvider initializing...');
  
  const [theme, setTheme] = useState<Theme>(() => {
    console.log('🎨 [THEME] Checking for saved theme preference...');
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      console.log('🎨 [THEME] Saved theme found:', savedTheme || 'none');
      if (savedTheme) return savedTheme;
    } catch (error) {
      console.error('❌ [THEME] Error reading theme from localStorage:', error);
    }

    console.log('🎨 [THEME] No saved theme, defaulting to light');
    return "light";
  });

  useEffect(() => {
    console.log('🎨 [THEME] Applying theme:', theme);
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    try {
      localStorage.setItem("theme", theme);
      console.log('✅ [THEME] Theme saved to localStorage');
    } catch (error) {
      console.error('❌ [THEME] Error saving theme to localStorage:', error);
    }
    
    console.log('✅ [THEME] Theme applied to DOM');
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log('🔄 [THEME] Toggling theme from', theme, 'to', newTheme);
    setTheme(newTheme);
  };

  const setThemeWrapper = (newTheme: Theme) => {
    console.log('🎨 [THEME] Setting theme to:', newTheme);
    setTheme(newTheme);
  };

  console.log('✅ [THEME] ThemeProvider initialized with theme:', theme);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeWrapper }}>
      {children}
    </ThemeContext.Provider>
  );
};

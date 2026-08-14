import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import { activateTheme, ThemeMode } from './theme';

const STORAGE_KEY = 'cestas-da-mel-theme';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  setMode(mode: ThemeMode): void;
  toggle(): void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const preferred = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
  const [mode, setModeState] = useState<ThemeMode>(preferred);
  activateTheme(mode);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = Platform.OS === 'web'
          ? globalThis.localStorage?.getItem(STORAGE_KEY)
          : await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') setModeState(saved);
      } catch { /* mantém a preferência do aparelho */ }
    };
    void load();
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.setItem(STORAGE_KEY, next);
      else void SecureStore.setItemAsync(STORAGE_KEY, next);
    } catch { /* o tema continua funcionando sem persistência */ }
  };

  const value = useMemo(() => ({ mode, isDark: mode === 'dark', setMode, toggle: () => setMode(mode === 'dark' ? 'light' : 'dark') }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider não configurado');
  return value;
}

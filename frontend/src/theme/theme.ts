import { StyleSheet } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export const darkColors = {
  background: '#0D0E12',
  surface: '#15171E',
  surfaceSoft: '#1D2028',
  surfaceGlass: 'rgba(21, 23, 30, 0.90)',
  ink: '#F8FAFC',
  muted: '#8B949E',
  border: '#2D313A',
  honey: '#E8A723',
  honeyDark: '#087E8B',
  honeyInk: '#090A0C',
  cocoa: '#111827',
  cocoaInk: '#F3F4F6',
  cyan: '#3B82F6', // Usando um azul mais profissional e neutro para ações
  cyanSoft: 'rgba(59, 130, 246, 0.15)',
  violet: '#8B5CF6',
  magenta: '#EC4899',
  green: '#10B981',
  greenSoft: 'rgba(16, 185, 129, 0.15)',
  red: '#EF4444',
  redSoft: 'rgba(239, 68, 68, 0.15)',
  backdrop: 'rgba(0, 0, 0, 0.65)',
  gridCyan: 'rgba(59, 130, 246, 0.05)',
  gridViolet: 'rgba(139, 92, 246, 0.05)',
  watermark: 'rgba(232, 167, 35, 0.03)',
};

export const lightColors: typeof darkColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSoft: '#F3F4F6',
  surfaceGlass: 'rgba(255, 255, 255, 0.90)',
  ink: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  honey: '#D97706',
  honeyDark: '#B45309',
  honeyInk: '#FFFBEB',
  cocoa: '#F3F4F6',
  cocoaInk: '#111827',
  cyan: '#2563EB', // Azul corporativo
  cyanSoft: 'rgba(37, 99, 235, 0.10)',
  violet: '#6D28D9',
  magenta: '#BE185D',
  green: '#059669',
  greenSoft: 'rgba(5, 150, 105, 0.10)',
  red: '#DC2626',
  redSoft: 'rgba(220, 38, 38, 0.10)',
  backdrop: 'rgba(0, 0, 0, 0.4)',
  gridCyan: 'rgba(37, 99, 235, 0.04)',
  gridViolet: 'rgba(109, 40, 217, 0.04)',
  watermark: 'rgba(217, 119, 6, 0.03)',
};

const darkShadows = {
  card: { shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  glow: { shadowColor: '#3B82F6', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
};

const lightShadows: typeof darkShadows = {
  card: { shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  glow: { shadowColor: '#2563EB', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
};

export type AppColors = typeof darkColors;
export type AppShadows = typeof darkShadows;

let activeColors: AppColors = darkColors;
let activeShadows: AppShadows = darkShadows;
let themeVersion = 0;

export function activateTheme(mode: ThemeMode) {
  activeColors = mode === 'dark' ? darkColors : lightColors;
  activeShadows = mode === 'dark' ? darkShadows : lightShadows;
  themeVersion += 1;
}

export const colors = new Proxy({} as AppColors, {
  get: (_, property: keyof AppColors) => activeColors[property],
});

export const shadows = new Proxy({} as AppShadows, {
  get: (_, property: keyof AppShadows) => activeShadows[property],
});

export function themedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (palette: AppColors, depth: AppShadows) => T): T {
  let cachedVersion = -1;
  let cached: T;
  return new Proxy({} as T, {
    get: (_, property: string | symbol) => {
      if (cachedVersion !== themeVersion) {
        cached = StyleSheet.create(factory(activeColors, activeShadows)) as T;
        cachedVersion = themeVersion;
      }
      return cached[property as keyof T];
    },
  });
}

import { StyleSheet } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export const darkColors = {
  background: '#040713',
  surface: '#0B1222',
  surfaceSoft: '#111D35',
  surfaceGlass: 'rgba(12, 21, 39, 0.94)',
  ink: '#F2F7FF',
  muted: '#8997B3',
  border: 'rgba(112, 232, 255, 0.18)',
  honey: '#F6C85F',
  honeyDark: '#22D3EE',
  honeyInk: '#07111E',
  cocoa: '#0A1830',
  cocoaInk: '#EAFBFF',
  cyan: '#22D3EE',
  cyanSoft: 'rgba(34, 211, 238, 0.12)',
  violet: '#8B5CF6',
  magenta: '#EC4899',
  green: '#38F2A5',
  greenSoft: 'rgba(56, 242, 165, 0.12)',
  red: '#FF5D7A',
  redSoft: 'rgba(255, 93, 122, 0.12)',
  backdrop: 'rgba(1, 4, 12, 0.78)',
  gridCyan: 'rgba(34, 211, 238, 0.09)',
  gridViolet: 'rgba(139, 92, 246, 0.08)',
  watermark: 'rgba(244, 184, 74, 0.035)',
};

export const lightColors: typeof darkColors = {
  background: '#F7F4EE',
  surface: '#FFFFFF',
  surfaceSoft: '#EEE8DE',
  surfaceGlass: 'rgba(255, 255, 255, 0.96)',
  ink: '#182331',
  muted: '#657184',
  border: 'rgba(20, 112, 126, 0.19)',
  honey: '#E8AD35',
  honeyDark: '#087E8B',
  honeyInk: '#071B22',
  cocoa: '#DFF3F5',
  cocoaInk: '#142E38',
  cyan: '#087E8B',
  cyanSoft: 'rgba(8, 126, 139, 0.10)',
  violet: '#7453C7',
  magenta: '#C73F7A',
  green: '#167D59',
  greenSoft: 'rgba(22, 125, 89, 0.10)',
  red: '#C43E59',
  redSoft: 'rgba(196, 62, 89, 0.10)',
  backdrop: 'rgba(24, 35, 49, 0.48)',
  gridCyan: 'rgba(8, 126, 139, 0.07)',
  gridViolet: 'rgba(116, 83, 199, 0.055)',
  watermark: 'rgba(153, 103, 17, 0.055)',
};

const darkShadows = {
  card: { shadowColor: '#22D3EE', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  glow: { shadowColor: '#22D3EE', shadowOpacity: 0.34, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
};

const lightShadows: typeof darkShadows = {
  card: { shadowColor: '#163C47', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  glow: { shadowColor: '#087E8B', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
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

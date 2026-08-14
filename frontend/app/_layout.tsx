import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/auth/AuthContext';
import { ThemeProvider, useAppTheme } from '../src/theme/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 0, retry: 1, refetchOnMount: 'always', refetchOnReconnect: true, refetchInterval: 30_000 },
    mutations: { retry: 0 },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider><ThemedApplication /></ThemeProvider>
    </QueryClientProvider>
  );
}

function ThemedApplication() {
  const { isDark } = useAppTheme();
  return <AuthProvider><StatusBar style={isDark ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false }} /></AuthProvider>;
}

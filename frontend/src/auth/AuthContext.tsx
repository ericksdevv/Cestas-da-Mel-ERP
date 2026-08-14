import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { configureApi } from '../api/client';
import { erpApi } from '../api/erp';

const TOKEN_KEY = 'cestas-da-mel-token';
const USER_KEY = 'cestas-da-mel-username';

const sessionStorage = {
  async get(key: string) {
    if (Platform.OS === 'web') return globalThis.sessionStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') globalThis.sessionStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') globalThis.sessionStorage?.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

interface AuthContextValue {
  token: string | null;
  username: string | null;
  loading: boolean;
  signIn(username: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    configureApi(null);
    setToken(null);
    setUsername(null);
    queryClient.clear();
    await Promise.all([sessionStorage.remove(TOKEN_KEY), sessionStorage.remove(USER_KEY)]);
  }, [queryClient]);

  useEffect(() => {
    Promise.all([sessionStorage.get(TOKEN_KEY), sessionStorage.get(USER_KEY)])
      .then(([stored, storedUsername]) => {
        if (stored) {
          configureApi(stored, () => void signOut());
          setToken(stored);
          setUsername(storedUsername ?? 'vinicius');
        }
      })
      .finally(() => setLoading(false));
  }, [signOut]);

  const signIn = useCallback(async (loginUsername: string, password: string) => {
    const auth = await erpApi.login(loginUsername.trim(), password);
    await Promise.all([sessionStorage.set(TOKEN_KEY, auth.token), sessionStorage.set(USER_KEY, auth.username)]);
    configureApi(auth.token, () => void signOut());
    setToken(auth.token);
    setUsername(auth.username);
  }, [signOut]);

  const value = useMemo(() => ({ token, username, loading, signIn, signOut }), [token, username, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return value;
}

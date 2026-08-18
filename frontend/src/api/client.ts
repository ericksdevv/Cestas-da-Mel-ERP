import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ApiError } from './types';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const browserHost = (globalThis as typeof globalThis & { location?: { hostname?: string } }).location?.hostname;
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const detectedHost = Platform.OS === 'web' ? browserHost : expoHost;
const fallbackHost = detectedHost || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
export const API_URL = (configuredUrl || `http://${fallbackHost}:8080/api`).replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 15_000;

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function configureApi(token: string | null, onUnauthorized?: () => void) {
  accessToken = token;
  unauthorizedHandler = onUnauthorized ?? null;
}

export function authenticatedImageSource(path: string) {
  return {
    uri: `${API_URL}${path}`,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  };
}

export async function fetchAuthenticatedImage(path: string, signal?: AbortSignal) {
  const headers = new Headers();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { headers, signal });
  if (response.status === 401 && accessToken) unauthorizedHandler?.();
  if (!response.ok) throw new Error('Não foi possível carregar a foto do produto.');
  return response.blob();
}

export class RequestError extends Error {
  constructor(public readonly status: number, public readonly details?: ApiError) {
    super(details?.message ?? `Não foi possível concluir a operação (${status}).`);
  }
}

export async function request<T>(path: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers, signal: controller.signal });
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') {
      throw new Error('A conexão demorou para responder. Tente novamente em alguns instantes.');
    }
    throw new Error('Não foi possível carregar os dados. Confira sua conexão e tente novamente.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 && accessToken) unauthorizedHandler?.();
  if (!response.ok) {
    let details: ApiError | undefined;
    try {
      details = (await response.json()) as ApiError;
    } catch {
      details = undefined;
    }
    throw new RequestError(response.status, details);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

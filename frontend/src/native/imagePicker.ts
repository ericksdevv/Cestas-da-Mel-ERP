import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type PickedImage = {
  uri: string;
  fileName: string;
  mimeType: string;
  file?: Blob;
};

type NativeResult = {
  canceled: boolean;
  assets: null | Array<{ uri: string; fileName?: string | null; mimeType?: string | null }>;
};

type NativeImagePicker = {
  requestCameraPermissionsAsync(): Promise<{ granted: boolean }>;
  requestMediaLibraryPermissionsAsync(writeOnly?: boolean): Promise<{ granted: boolean }>;
  launchCameraAsync(options: Record<string, unknown>): Promise<NativeResult>;
  launchImageLibraryAsync(options: Record<string, unknown>): Promise<NativeResult>;
};

const nativePicker = Platform.OS === 'web'
  ? null
  : requireNativeModule<NativeImagePicker>('ExponentImagePicker');

const options = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 };
const receiptOptions = { mediaTypes: ['images'], allowsEditing: false, quality: 0.55 };

export async function takeProductPhoto(): Promise<PickedImage | null> {
  if (Platform.OS === 'web') return chooseWebImage(true);
  const permission = await nativePicker!.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Permita o acesso à câmera para tirar a foto.');
  return normalize(await nativePicker!.launchCameraAsync(options));
}
export async function chooseProductPhoto(): Promise<PickedImage | null> {
  if (Platform.OS === 'web') return chooseWebImage(false);
  const permission = await nativePicker!.requestMediaLibraryPermissionsAsync(false);
  if (!permission.granted) throw new Error('Permita o acesso às fotos para escolher uma imagem.');
  return normalize(await nativePicker!.launchImageLibraryAsync(options));
}

export async function takeReceiptPhoto(): Promise<PickedImage | null> {
  if (Platform.OS === 'web') return chooseWebImage(true);
  const permission = await nativePicker!.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Permita o acesso à câmera para fotografar a nota.');
  return normalize(await nativePicker!.launchCameraAsync(receiptOptions), 'nota-fiscal');
}

export async function chooseReceiptPhoto(): Promise<PickedImage | null> {
  if (Platform.OS === 'web') return chooseWebImage(false);
  const permission = await nativePicker!.requestMediaLibraryPermissionsAsync(false);
  if (!permission.granted) throw new Error('Permita o acesso às fotos para escolher a nota.');
  return normalize(await nativePicker!.launchImageLibraryAsync(receiptOptions), 'nota-fiscal');
}

function normalize(result: NativeResult, baseName = 'produto'): PickedImage | null {
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const detectedMime = normalizeMimeType(asset.mimeType, asset.uri);
  return {
    uri: asset.uri,
    fileName: normalizeFileName(asset.fileName, detectedMime, baseName),
    mimeType: detectedMime,
  };
}

function chooseWebImage(camera: boolean): Promise<PickedImage | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.heic,.heif';
    if (camera) input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      resolve({ uri: URL.createObjectURL(file), fileName: file.name, mimeType: file.type || 'image/jpeg', file });
    };
    input.click();
  });
}

function normalizeMimeType(mimeType?: string | null, uri = '') {
  const value = mimeType?.toLowerCase();
  if (value === 'image/jpg') return 'image/jpeg';
  if (value) return value;
  const cleanUri = uri.split('?')[0].toLowerCase();
  if (cleanUri.endsWith('.png')) return 'image/png';
  if (cleanUri.endsWith('.webp')) return 'image/webp';
  if (cleanUri.endsWith('.heic')) return 'image/heic';
  if (cleanUri.endsWith('.heif')) return 'image/heif';
  return 'image/jpeg';
}

function normalizeFileName(fileName: string | null | undefined, mimeType: string, baseName: string) {
  const extension = mimeType === 'image/png' ? 'png'
    : mimeType === 'image/webp' ? 'webp'
      : mimeType === 'image/heic' ? 'heic'
        : mimeType === 'image/heif' ? 'heif'
          : 'jpg';
  if (!fileName) return `${baseName}-${Date.now()}.${extension}`;
  if (/\.[a-z0-9]+$/i.test(fileName)) return fileName;
  return `${fileName}.${extension}`;
}

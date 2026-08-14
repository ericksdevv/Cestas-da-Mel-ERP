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

function normalize(result: NativeResult): PickedImage | null {
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    fileName: asset.fileName || `produto-${Date.now()}.jpg`,
    mimeType: asset.mimeType || 'image/jpeg',
  };
}

function chooseWebImage(camera: boolean): Promise<PickedImage | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    if (camera) input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      resolve({ uri: URL.createObjectURL(file), fileName: file.name, mimeType: file.type || 'image/jpeg', file });
    };
    input.click();
  });
}

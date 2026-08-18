import { ReactNode, useEffect, useState } from 'react';
import { Image, ImageStyle, Platform, StyleProp } from 'react-native';
import { authenticatedImageSource, fetchAuthenticatedImage } from '../api/client';

export function ProductImage({ productId, hasImage, imageVersion, style, fallback }: {
  productId: number;
  hasImage: boolean;
  imageVersion?: number;
  style: StyleProp<ImageStyle>;
  fallback: ReactNode;
}) {
  const [webUri, setWebUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const path = `/products/${productId}/image`;

  useEffect(() => {
    setFailed(false);
    if (Platform.OS !== 'web' || !hasImage) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    fetchAuthenticatedImage(path, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setWebUri(objectUrl);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setWebUri(null);
    };
  }, [hasImage, imageVersion, path]);

  if (!hasImage || failed || (Platform.OS === 'web' && !webUri)) return <>{fallback}</>;
  return <Image source={Platform.OS === 'web' ? { uri: webUri! } : authenticatedImageSource(path)} style={style} onError={() => setFailed(true)} />;
}

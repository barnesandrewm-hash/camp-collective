import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

export async function requestMediaPermission(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

export async function saveDrawingToGallery(
  base64Png: string
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const filename = `doodleverse_${Date.now()}.png`;
    const tempUri = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(tempUri, base64Png, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const hasPermission = await requestMediaPermission();
    if (!hasPermission) {
      return { success: false, error: 'no-permission' };
    }

    const asset = await MediaLibrary.createAssetAsync(tempUri);
    await MediaLibrary.createAlbumAsync('Doodleverse', asset, false);

    await FileSystem.deleteAsync(tempUri, { idempotent: true });

    return { success: true, uri: asset.uri };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

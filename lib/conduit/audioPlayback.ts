import { File, Paths } from "expo-file-system";

/**
 * Write base64 audio (MP3) to a cache file and return its file:// URI for
 * use with expo-audio. The cache directory is cleaned by the OS under
 * pressure so we don't have to track files.
 */
export function writeBase64AudioToCache(base64: string, suffix = "mp3"): string {
  const file = new File(
    Paths.cache,
    `praxis-tts-${Date.now()}.${suffix}`,
  );
  file.create({ overwrite: true });
  file.write(base64, { encoding: "base64" });
  return file.uri;
}

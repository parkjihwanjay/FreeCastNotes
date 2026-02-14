/**
 * Image compression and validation utilities.
 * Images are stored as base64 data URLs in localStorage.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB raw
const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.85;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "File is not an image";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Image is too large (max 10MB)";
  }
  return null;
}

export function compressImage(
  file: File,
  maxWidth = MAX_WIDTH,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");

        let width = img.width;
        let height = img.height;

        // Only downscale, never upscale
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

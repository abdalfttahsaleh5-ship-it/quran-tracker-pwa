/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Resizes the image to fit within maxDimension x maxDimension while preserving aspect ratio.
 * Outputs a Blob compressed as image/webp (or image/jpeg fallback).
 */
export async function compressImage(
  file: File,
  maxDimension = 400,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("فشل إنشاء سياق الرسم في المتصفح"));
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("فشل ضغط الصورة"));
            }
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => reject(new Error("ملف الصورة غير صالح"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("فشل قراءة ملف الصورة"));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Blob to a base64 data URL string for fast preview and inline payload upload.
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("فشل تحويل الصورة إلى نص"));
    reader.readAsDataURL(blob);
  });
}

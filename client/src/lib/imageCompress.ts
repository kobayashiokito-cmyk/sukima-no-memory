/**
 * スキマの記憶 — 画像圧縮ユーティリティ
 * Canvas APIを使用して画像をリサイズ・圧縮する
 * 最大幅: 1200px, JPEG品質: 80%
 */

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.8;
const OUTPUT_TYPE = "image/jpeg";

/**
 * File → 圧縮済みBase64文字列
 */
export async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

          // Draw with white background (for transparent PNGs)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL(OUTPUT_TYPE, QUALITY);
          resolve({ base64, mimeType: OUTPUT_TYPE });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Get a preview URL from a File (for immediate display)
 */
export function getPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

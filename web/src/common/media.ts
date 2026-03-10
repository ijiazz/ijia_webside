import { canvasToBlob, loadImage } from "@/lib/image.ts";

export type PreprocessImageFileOption = {
  fallbackLimitSize?: number;
};
export async function preprocessImageFile(file: File, option: PreprocessImageFileOption = {}): Promise<File> {
  const { fallbackLimitSize } = option;
  const img = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if (fallbackLimitSize && file.size < fallbackLimitSize) {
      return file;
    }
    throw new Error("当前浏览器无法获取 canvas 上下文，预处理图片失败");
  }

  ctx.drawImage(img, 0, 0);

  let blob: Blob;
  let type: string;
  try {
    const res = await preprocessCanvasImage(canvas);
    blob = res.blob;
    type = res.type;
  } catch (error) {
    if (fallbackLimitSize && file.size < fallbackLimitSize) {
      return file;
    }
    throw error;
  }

  const fileName = replaceFileExtension(file.name, type.split("/")[1]);
  return new File([blob], fileName, { type, lastModified: Date.now() });
}
export async function preprocessCanvasImage(canvas: HTMLCanvasElement): Promise<{ blob: Blob; type: string }> {
  const types: string[] = ["image/webp", "image/jpeg"];
  let fileInfo: { blob: Blob; type: string } | null = null;

  for (const t of types) {
    try {
      const b = await canvasToBlob(canvas, t);
      fileInfo = { blob: b, type: t };
      break;
    } catch (error) {
      console.warn(`尝试使用 ${t} 格式失败，错误:`, error);
    }
  }

  if (!fileInfo) {
    throw new Error("无法将图片转换为支持的格式");
  }
  return fileInfo;
}
function replaceFileExtension(fileName: string, newExtension: string): string {
  return fileName.replace(/(\.[^/.]*)?$/, `.${newExtension}`);
}

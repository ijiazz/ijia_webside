import { canvasToBlob, loadImage } from "@/lib/image.ts";

export type PreprocessImageFileOption = {
  fallbackLimitSize?: number;
  maxWidth?: number;
  maxHeight?: number;
  fillColor?: string;
};
function calcSize(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const aspectRatio = imageWidth / imageHeight;
  const targetMaxWidth = Math.min(maxWidth, imageWidth);
  const targetMaxHeight = Math.min(maxHeight, imageHeight);

  let width: number;
  let height: number;

  if (targetMaxWidth / aspectRatio <= targetMaxHeight) {
    width = targetMaxWidth;
    height = targetMaxWidth / aspectRatio;
  } else {
    width = targetMaxHeight * aspectRatio;
    height = targetMaxHeight;
  }

  return { width, height };
}
export async function preprocessImageFile(file: Blob, option: PreprocessImageFileOption = {}): Promise<Blob> {
  const { fallbackLimitSize, fillColor, maxHeight, maxWidth } = option;
  const img = await loadImage(file);

  const canvas = document.createElement("canvas");
  if (maxHeight || maxWidth) {
    const { height, width } = calcSize(
      img.naturalWidth,
      img.naturalHeight,
      maxWidth ?? Infinity,
      maxHeight ?? Infinity,
    );
    canvas.width = width;
    canvas.height = height;
  } else {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if (fallbackLimitSize && file.size < fallbackLimitSize) {
      return file;
    }
    throw new Error("当前浏览器无法获取 canvas 上下文，预处理图片失败");
  }
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  let blob: Blob;
  try {
    blob = await preprocessCanvasImage(canvas);
  } catch (error) {
    if (fallbackLimitSize && file.size < fallbackLimitSize) {
      return file;
    }
    throw error;
  }

  return blob;
}
export async function preprocessCanvasImage(canvas: HTMLCanvasElement): Promise<Blob> {
  const types: string[] = ["image/webp", "image/jpeg"];
  let fileInfo: Blob | null = null;

  for (const t of types) {
    try {
      fileInfo = await canvasToBlob(canvas, t, 0.8);
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

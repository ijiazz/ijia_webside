export async function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectURL = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectURL);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectURL);
      reject(new Error("加载图片失败"));
    };

    img.src = objectURL;
  });
}
export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("canvas toBlob 返回空"));
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

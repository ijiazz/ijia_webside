import { UploadFileResult, UploadMethod } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { uploadToTemp } from "./upload.ts";

const SIZE_LIMIT: Record<string, number | undefined> = {
  image: 5 * 1024,
  audio: 1 * 1024 * 1024,
};

export async function uploadQuestion(stream: ReadableStream<Uint8Array>, mime: string): Promise<UploadFileResult> {
  const mediaType = mime.split("/")[0];
  const limitSize = SIZE_LIMIT[mediaType];

  if (limitSize === undefined) throw new HttpError(400, "不支持的文件类型");

  return uploadToTemp(stream, UploadMethod.question, { limitByte: limitSize });
}

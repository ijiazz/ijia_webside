import { MediaType, UploadFileResult, UploadImageFileResult, UploadMethod } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { FileTooLargeError, uploadToTemp, getFileURL } from "./upload.ts";
import * as mimeType from "@std/media-types";

const MB = 1024 * 1024;
const SIZE_LIMIT: Record<string, number | undefined> = {
  image: 0.5 * MB,
  audio: 1 * MB,
};

export async function uploadQuestion(
  stream: ReadableStream<Uint8Array>,
  option: { mime: string; fileSize?: number },
): Promise<UploadFileResult | UploadImageFileResult> {
  const { mime, fileSize } = option;
  const mediaType = mime.split("/")[0];
  const limitSize = SIZE_LIMIT[mediaType];
  const suffix = mimeType.extension(mime);

  if (limitSize === undefined || !suffix) throw new HttpError(400, "不支持的文件类型");
  if (fileSize !== undefined && fileSize > limitSize) {
    throw new FileTooLargeError(limitSize);
  }

  const key = await uploadToTemp(stream, { prefix: UploadMethod.question, limitByte: limitSize, suffix: `.${suffix}` });
  switch (mediaType) {
    case "image": {
      const previewURL = getFileURL(key);
      const result: UploadImageFileResult = {
        uploadFileKey: key,
        type: MediaType.image,
        image: {
          url: previewURL,
        },
      };
      return result;
    }

    default:
      return {
        uploadFileKey: key,
      };
  }
}

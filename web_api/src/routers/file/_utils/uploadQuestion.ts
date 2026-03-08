import { MediaType, UploadFileResult, UploadImageFileResult, UploadMethod } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { FileTooLargeError, uploadToTemp, tempKeyToURI } from "./upload.ts";
import * as mimeType from "@std/media-types";
import { createHash } from "node:crypto";
import { getOSS } from "@ijia/data/oss";

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
    // 需要读取所有，才能给前端一个正确的响应
    await pipeToNull(stream);
    throw new FileTooLargeError(limitSize);
  }
  const hash = createHash("md5");

  let totalSize = 0;
  const uploadRes = await uploadToTemp(stream, {
    prefix: UploadMethod.question,
    scan: (data) => {
      totalSize += data.length;
      if (totalSize > limitSize) {
        throw new FileTooLargeError(limitSize);
      }
      hash.update(data);
    },
  });
  const hashHex = hash.digest("hex");
  const tempKey = await getOSS().tempDir.rename(uploadRes.tempKey, `${uploadRes.fileName}_${hashHex}.${suffix}`);

  switch (mediaType) {
    case "image": {
      const imageURI = tempKeyToURI(tempKey);
      const result: UploadImageFileResult = {
        tempURI: tempKey,
        type: MediaType.image,
        image: {
          uri: imageURI,
        },
      };
      return result;
    }

    default:
      return {
        tempURI: tempKey,
      };
  }
}
async function pipeToNull(stream: ReadableStream) {
  for await (const chunk of stream) {
  }
}

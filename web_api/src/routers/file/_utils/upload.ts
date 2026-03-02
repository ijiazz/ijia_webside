import { ENV, RunMode } from "@/config.ts";
import { UploadFileResult } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { getOSS } from "@ijia/data/oss";

export async function uploadToTemp(
  stream: ReadableStream<Uint8Array>,
  options: {
    prefix: string;
    suffix: string;
    limitByte: number;
  },
): Promise<UploadFileResult> {
  const { limitByte, suffix, prefix } = options;
  const oss = getOSS();

  let saveStream: ReadableStream<Uint8Array>;
  if (limitByte) {
    let length = 0;
    saveStream = stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          length += chunk.length;
          if (length > limitByte!) {
            controller.error(new FileTooLargeError(limitByte));
          } else {
            controller.enqueue(chunk);
          }
        },
      }),
    );
  } else {
    saveStream = stream;
  }

  const { tempKey } = await oss.tempDir.save(saveStream, {
    prefix,
    suffix,
    lifetime: ENV.MODE === RunMode.Dev ? 1 : 60,
  });
  return {
    previewURL: getPreviewURL(tempKey),
    uploadFileKey: tempKey,
  };
}
export class FileTooLargeError extends HttpError {
  constructor(limitByte: number) {
    super(400, `文件大小不能超过${limitByte / 1024}KB`);
  }
}

export function getPreviewURL(tempKey: string): string {
  return `/temp/${tempKey}`;
}

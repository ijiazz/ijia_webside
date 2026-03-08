import { ENV, RunMode } from "@/config.ts";
import { HttpError } from "@/global/errors.ts";
import { getOSS, SaveResult } from "@ijia/data/oss";

export async function uploadToTemp(
  stream: ReadableStream<Uint8Array>,
  options: {
    prefix: string;
    suffix?: string;
    scan: (data: Uint8Array) => void;
  },
): Promise<SaveResult> {
  const { suffix, prefix, scan } = options;
  const oss = getOSS();

  let saveStream: ReadableStream<Uint8Array>;
  if (scan) {
    saveStream = stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          scan(chunk);
          controller.enqueue(chunk);
        },
      }),
    );
  } else {
    saveStream = stream;
  }

  return oss.tempDir.save(saveStream, {
    prefix,
    suffix,
    lifetime: ENV.MODE === RunMode.Dev ? 1 : 60,
  });
}
export class FileTooLargeError extends HttpError {
  constructor(limitByte: number) {
    super(400, `文件大小不能超过${limitByte / 1024}KB`);
  }
}

export function tempKeyToURI(tempKey: string): string {
  return `/_temp/${tempKey}`;
}

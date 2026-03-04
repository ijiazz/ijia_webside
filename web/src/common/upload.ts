import { UploadMethod } from "@/api.ts";
import { fileAPI } from "@/request/client.ts";

export async function uploadStream(config: {
  readableStream: ReadableStream<Uint8Array>;
  method: UploadMethod;
  mime: string;
  size: number;
}) {
  const { readableStream, method, mime, size } = config;

  const { previewURL } = await fileAPI["/file/upload"].put({
    duplex: "half", // 必需
    body: readableStream,
    query: { method },
    headers: { "Content-Type": mime, "Content-Length": size.toString() },
  });
  return previewURL;
}

export async function uploadBlob(blob: Blob, method: UploadMethod) {
  const { previewURL } = await fileAPI["/file/upload"].put({
    body: blob,
    query: { method },
    headers: { "Content-Type": blob.type },
  });
  return previewURL;
}

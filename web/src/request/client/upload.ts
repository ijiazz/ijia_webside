import { MediaType, UploadFileResult, UploadImageFileResult, UploadMethod } from "@/api.ts";
import { ApiErrorEvent, apiEvent } from "./event.ts";
import { fileURIToURL, getResponseErrorInfo } from "./util.ts";

export type UploadBlobConfig = {
  file: Blob;
  method: UploadMethod;
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
};
export async function uploadBlob<T extends UploadFileResult>(config: UploadBlobConfig): Promise<T> {
  const { file, method, onProgress, signal } = config;
  const resp = await new Promise<Response>((resolve, reject) => {
    if (signal) {
      signal.throwIfAborted();
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("上传被中断"));
      });
    }
    const xhr = new XMLHttpRequest();
    xhr.onerror = (e) => {
      reject(new Error("网络错误或请求被中断"));
    };
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        onProgress(event.loaded, event.total);
      };
    }

    xhr.open("PUT", "/file/upload?method=" + method);
    xhr.responseType = "arraybuffer";
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
    xhr.onload = () => {
      const resp = getXhrResponse(xhr);
      resolve(resp);
    };
  });

  if (resp.ok) {
    return (await resp.json()) as T;
  } else {
    const contentType = resp.headers.get("content-type") || "";
    let data: any;
    switch (contentType) {
      case "application/json": {
        data = await resp.json();
        break;
      }
      default:
        data = await resp.text();
        break;
    }
    const errorInfo = getResponseErrorInfo(data);
    apiEvent.dispatchEvent(new ApiErrorEvent({ headers: resp.headers, status: resp.status, body: data }));
    throw new UploadError(errorInfo?.message ?? `上传失败，状态码: ${resp.status}`);
  }
}
class UploadError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function getXhrResponse(xhr: XMLHttpRequest): Response {
  const headers = new Headers();
  for (const element of xhr.getAllResponseHeaders().split("\r\n")) {
    const [key, value] = element.split(": ");
    if (key && value) {
      headers.append(key, value);
    }
  }
  return new Response(xhr.response, {
    status: xhr.status,
    statusText: xhr.statusText,
    headers,
  });
}

export function getImagePreviewURL(file: UploadFileResult | UploadImageFileResult): string | null {
  if ("type" in file && file.type === "image" && file.type === MediaType.image) {
    return fileURIToURL(file.image.uri);
  }
  return null;
}

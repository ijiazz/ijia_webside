import { UploadMethod } from "@/api.ts";

export type UploadBlobConfig = {
  file: Blob;
  method: UploadMethod;
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
};
export async function uploadBlob(config: UploadBlobConfig): Promise<string> {
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
    const json = await resp.json();
    return json.previewURL;
  } else {
    throw new Error(`上传失败，状态码: ${resp.status}`);
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

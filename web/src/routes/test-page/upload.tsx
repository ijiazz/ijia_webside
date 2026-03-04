import { uploadBlob, uploadStream } from "@/common/upload.ts";
import { listenStream } from "@/lib/stream.ts";
import { UploadMethod } from "@ijia/api-types";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "antd";
import { Upload } from "@/components/Upload.tsx";

export const Route = createFileRoute("/test-page/upload")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Upload
        customRequest={(option) => {
          const { file, filename, onError, onProgress, onSuccess } = option;
          if (!(file instanceof Blob)) {
            onError?.(new Error("不支持的文件类型"));
            return;
          }
          uploadBlob(file, UploadMethod.question).then(onSuccess, (e) => {
            console.error(e);
            onError?.(e instanceof Error ? e : new Error("上传失败"));
          });
          return;
          const stream = listenStream(file.stream(), {
            onProgress: (uploaded) => {
              onProgress?.({
                percent: Math.round((uploaded / file.size) * 100),
              });
            },
          });
          uploadStream({
            readableStream: stream,
            method: UploadMethod.question,
            mime: file.type,
            size: file.size,
          }).then(onSuccess, (e) => {
            console.error(e);
            onError?.(e instanceof Error ? e : new Error("上传失败"));
          });
        }}
      >
        <Button>Click to Upload</Button>
      </Upload>
    </div>
  );
}

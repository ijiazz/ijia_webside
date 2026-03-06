import { uploadBlob } from "@/common/upload.ts";
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

          uploadBlob({
            file,
            method: UploadMethod.question,
            onProgress: (loaded, total) => onProgress?.({ percent: (loaded / total) * 100 }),
          }).then(onSuccess, (e) => {
            onError?.(e);
            console.error(e);
          });
        }}
      >
        <Button>Click to Upload</Button>
      </Upload>
    </div>
  );
}

import { getImagePreviewURL, uploadBlob } from "@/request/client.ts";
import { UploadMethod } from "@ijia/api-types";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Button, UploadFile } from "antd";
import { Upload } from "@/components/Upload.tsx";
import { useState } from "react";
export const Route = createLazyFileRoute("/_theme/test-page/upload")({
  component: RouteComponent,
});

function RouteComponent() {
  const [fileList, setFileList] = useState<UploadFile<any>[]>([]);
  console.log("fileList", fileList);
  return (
    <div>
      <Upload
        fileList={fileList}
        onChange={(value) => setFileList(value.fileList)}
        listType="picture-card"
        iconRender={() => "111"}
        showUploadList={
          {
            // showPreviewIcon: false,
          }
        }
        onPreview={(file) => {
          const url = getImagePreviewURL(file.response);
          if (url) {
            window.open(url, "_blank");
          }
        }}
        customRequest={(option) => {
          const { file, filename, onError, onProgress, onSuccess } = option;

          uploadBlob({
            file,
            method: UploadMethod.question,
            onProgress: (loaded, total) => onProgress?.({ percent: (loaded / total) * 100 }),
          }).then(
            (res) => {
              console.log("上传成功:", res);
              onSuccess?.(res);
            },
            (e) => {
              onError?.(e);
              console.error(e);
            },
          );
        }}
      >
        <Button>Click to Upload</Button>
      </Upload>
    </div>
  );
}

import { getImagePreviewURL, uploadBlob } from "@/request/client.ts";
import { UploadMethod } from "@ijia/api-types";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Button, UploadFile } from "antd";
import { Upload } from "@/components/Upload.tsx";
import { useState } from "react";
import { CropImageModal } from "./-components/Crop.tsx";

export const Route = createLazyFileRoute("/_theme/test-page/upload")({
  component: RouteComponent,
});

function RouteComponent() {
  const [fileList, setFileList] = useState<UploadFile<any>[]>([]);

  const [pendingCropImage, setPendingCropImage] = useState<{
    file: File;
    resolve: (file: File | Promise<File>) => void;
  } | null>(null);
  const [cropImageModalOpen, setCropImageModalOpen] = useState<boolean>(false);

  return (
    <div>
      <Upload
        fileList={fileList}
        beforeUpload={(file) => {
          return new Promise((resolve) => {
            setPendingCropImage({ file, resolve });
            setCropImageModalOpen(true);
          });
        }}
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
          onSuccess?.(undefined);
          return;

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
        <Button>上传图片</Button>
      </Upload>
      <CropImageModal open={cropImageModalOpen} onCropComplete={() => {}} image={pendingCropImage?.file} />
    </div>
  );
}

import { getImagePreviewURL, uploadBlob } from "@/request/client.ts";
import { UploadFileResult, UploadMethod } from "@/api.ts";
import { createLazyFileRoute } from "@tanstack/react-router";
import { UploadFile } from "antd";
import { Upload } from "@/components/Upload.tsx";
import { useState } from "react";
import { useCropModal } from "@/components/ImageCrop.tsx";
import { UploadOutlined } from "@ant-design/icons";
import { useImagePreviewModal } from "@/components/Modal.ts";

export const Route = createLazyFileRoute("/_theme/test-page/upload")({
  component: RouteComponent,
});
type UploadResult = UploadFileResult;

function RouteComponent() {
  const [fileList, setFileList] = useState<UploadFile<UploadResult>[]>([]);

  const imagePreview = useImagePreviewModal();
  const openCrop = useCropModal();

  return (
    <div>
      <Upload<UploadResult>
        fileList={fileList}
        accept="image/*"
        beforeUpload={async (file) => {
          const blob = await openCrop(file, {
            fillColor: "#fff",
            maxHeight: 1280,
            maxWidth: 1280,
          });
          const fileName = replaceFileExtension(file.name, blob.type.split("/")[1]);
          const cropFile = new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
          return cropFile;
        }}
        onChange={(value) => setFileList(value.fileList)}
        listType="picture-card"
        onPreview={(file) => {
          if (file.response) {
            const url = getImagePreviewURL(file.response);
            if (url) imagePreview.open({ url });
          } else {
            const url = URL.createObjectURL(file.originFileObj!);
            imagePreview.open({
              url,
              onClear: () => URL.revokeObjectURL(url),
            });
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
        <UploadOutlined />
      </Upload>
    </div>
  );
}

function replaceFileExtension(fileName: string, newExtension: string): string {
  return fileName.replace(/(\.[^/.]*)?$/, `.${newExtension}`);
}

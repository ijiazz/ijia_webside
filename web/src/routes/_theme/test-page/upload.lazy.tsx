import { getImagePreviewURL, uploadBlob } from "@/request/client.ts";
import { UploadFileResult, UploadMethod } from "@/api.ts";
import { createLazyFileRoute } from "@tanstack/react-router";
import { UploadFile } from "antd";
import { Upload } from "@/components/Upload.tsx";
import { useState } from "react";
import { CropImageModal } from "./-components/Crop.tsx";
import { UploadOutlined } from "@ant-design/icons";
import {} from "@/components/Modal.ts";
import { useModal } from "@/components/Modal.ts";

export const Route = createLazyFileRoute("/_theme/test-page/upload")({
  component: RouteComponent,
});
type UploadResult = UploadFileResult;

const cache = new WeakMap<File, string>();
function RouteComponent() {
  const [fileList, setFileList] = useState<UploadFile<UploadResult>[]>([]);

  const [pendingCropImage, setPendingCropImage] = useState<{
    file: File;
    resolve: (file: File | Promise<File>) => void;
  } | null>(null);
  const [cropImageModalOpen, setCropImageModalOpen] = useState<boolean>(false);
  const modals = useModal();
  return (
    <div>
      <Upload<UploadResult>
        fileList={fileList}
        beforeUpload={(file) => {
          return new Promise((resolve) => {
            setPendingCropImage({ file, resolve });
            setCropImageModalOpen(true);
          });
        }}
        onChange={(value) => setFileList(value.fileList)}
        listType="picture-card"
        showUploadList={{
          extra: (file) => {
            const size = file.size || 0;
            return <span style={{ color: "#cccccc" }}>({(size / 1024).toFixed(2)}KB)</span>;
          },
        }}
        onPreview={(file) => {
          console.log("预览文件:", file);
          const url = file.response ? getImagePreviewURL(file.response) : getFilePreviewURL(file.originFileObj!);
          if (url) {
            modals.open({
              title: "图片预览",
              centered: true,
              children: (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <img src={url} />
                </div>
              ),
              width: 600,
            });
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
        <UploadOutlined />
      </Upload>
      <CropImageModal
        open={cropImageModalOpen}
        onCropComplete={(file) => {
          pendingCropImage?.resolve(file);
          setPendingCropImage(null);
          setCropImageModalOpen(false);
        }}
        image={pendingCropImage?.file}
      />
    </div>
  );
}
function getFilePreviewURL(file: File) {
  if (cache.has(file)) {
    return cache.get(file)!;
  }
  const url = URL.createObjectURL(file);
  cache.set(file, url);
  return url;
}

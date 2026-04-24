import { binaryToBase64 } from "@/common/base64.ts";
import { useCropModal } from "@/components/ImageCrop.tsx";
import { Upload, UploadProps } from "@/components/Upload.tsx";
import { PlusOutlined } from "@ant-design/icons";
export type ImageOptionUploadProps = Omit<
  UploadProps<undefined>,
  "fileList" | "beforeUpload" | "customRequest" | "onChange"
> & {
  onChange?: (file: { base64: string; type: string }) => void;
};
export function ImageOptionUpload(props: ImageOptionUploadProps) {
  const { onChange, children, ...rest } = props;
  const openCrop = useCropModal();
  return (
    <Upload
      accept="image/*"
      {...rest}
      fileList={[]}
      listType="picture-card"
      beforeUpload={async (file) => {
        const blob = await openCrop(file, {
          fillColor: "#fff",
          maxHeight: 1280,
          maxWidth: 1280,
        });
        const buffer = await blob.arrayBuffer();
        const data = binaryToBase64(new Uint8Array(buffer));
        onChange?.({ base64: data, type: blob.type });
        return false;
      }}
      customRequest={({ onSuccess }) => onSuccess?.(undefined)}
    >
      {children ?? <PlusOutlined />}
    </Upload>
  );
}

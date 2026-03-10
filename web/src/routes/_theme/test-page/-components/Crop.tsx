import { useMemo, useEffect, useRef } from "react";
import "cropperjs/dist/cropper.css";
import { ReactCropperElement, Cropper } from "react-cropper";
import { preprocessCanvasImage, preprocessImageFile } from "@/common/media.ts";
import { Modal } from "antd";
import { useMutation } from "@tanstack/react-query";

const ImageCrop = Cropper;

export type CropProps = {
  image: string | File;
  ref?: React.Ref<ReactCropperElement>;
};
export function CropImage(props: CropProps) {
  const { image, ref: cropperRef } = props;

  const imageURL = useMemo(() => {
    if (typeof image === "string") return image;
    return URL.createObjectURL(image);
  }, [image]);

  useEffect(() => {
    return () => {
      if (typeof image === "string") return;
      URL.revokeObjectURL(imageURL);
    };
  }, [image, imageURL]);

  return (
    <div
      style={{
        minHeight: 400,
        border: "1px solid red",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <ImageCrop src={imageURL} style={{ height: 400, width: "100%" }} ref={cropperRef} />
    </div>
  );
}
export type CropImageModalProps = {
  image?: File;
  open: boolean;
  onCropComplete: (file: File) => void;
};
export function CropImageModal(props: CropImageModalProps) {
  const { image, open, onCropComplete } = props;
  const cropperRef = useRef<ReactCropperElement>(null);
  const { isPending, mutate } = useMutation({
    mutationFn: async (data: ReactCropperElement | File) => {
      if (data instanceof File) {
        return preprocessImageFile(data);
      } else {
        const cropper = data.cropper;
        const canvas = cropper.getCroppedCanvas();
        const { blob, type } = await preprocessCanvasImage(canvas);
        return new File([blob], `cropped.${type.split("/")[1]}`, { type, lastModified: Date.now() });
      }
    },
    onSuccess: (file) => {
      onCropComplete(file);
    },
  });
  return (
    <Modal
      title="裁剪图片"
      open={open}
      onCancel={() => {
        image && mutate(image);
      }}
      onOk={() => {
        const cropper = cropperRef?.current;
        if (!cropper) return;
        mutate(cropper);
      }}
      okButtonProps={{
        loading: isPending,
      }}
    >
      {image && <CropImage image={image} ref={cropperRef} />}
    </Modal>
  );
}

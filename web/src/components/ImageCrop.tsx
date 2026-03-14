import { useMemo, useEffect, useRef, useCallback } from "react";
import "cropperjs/dist/cropper.css";
import { ReactCropperElement, Cropper } from "react-cropper";
import { preprocessCanvasImage, preprocessImageFile, PreprocessImageFileOption } from "@/common/media.ts";
import { Modal } from "antd";
import { useMutation } from "@tanstack/react-query";
import { useModal } from "@/components/Modal.ts";
import { afterTime } from "evlib";

const ImageCrop = Cropper;

type CropProps = {
  image: string | Blob;
  ref?: React.Ref<ReactCropperElement>;
};
function CropImage(props: CropProps) {
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
      <ImageCrop
        minCanvasHeight={100}
        minCanvasWidth={100}
        minCropBoxHeight={100}
        minCropBoxWidth={100}
        minContainerHeight={400}
        // viewMode={1}
        dragMode="move"
        src={imageURL}
        style={{ width: "100%" }}
        ref={cropperRef}
      />
    </div>
  );
}
export type CropOption = Pick<PreprocessImageFileOption, "fillColor" | "maxHeight" | "maxWidth"> & {};
export type CropImageModalProps = {
  image?: Blob;
  open: boolean;
  onCropComplete: (file: Blob) => void;
  config?: CropOption;
};
export function CropImageModal(props: CropImageModalProps) {
  const { image, open, onCropComplete, config } = props;
  const cropperRef = useRef<ReactCropperElement>(null);
  const { isPending, mutate } = useCrop();
  return (
    <Modal
      title="裁剪图片"
      open={open}
      cancelText="跳过"
      centered
      onCancel={() => {
        image && mutate({ data: image, config }, { onSuccess: (data) => onCropComplete(data) });
      }}
      onOk={() => {
        const cropper = cropperRef?.current;
        if (!cropper) return;
        mutate({ data: cropper, config }, { onSuccess: (data) => onCropComplete(data) });
      }}
      cancelButtonProps={{
        disabled: isPending,
      }}
      okButtonProps={{
        loading: isPending,
      }}
    >
      {image && <CropImage image={image} ref={cropperRef} />}
    </Modal>
  );
}

export function useCropModal() {
  const modals = useModal();

  const cropperRef = useRef<ReactCropperElement>(null);
  const { mutate } = useCrop();

  const open = useCallback((image: Blob, config: CropOption): Promise<Blob> => {
    return new Promise<Blob>((resolve) => {
      const { id } = modals.open({
        children: <CropImage ref={cropperRef} image={image!} />,
        onOk(e) {
          modals.update(id, (prev) => ({
            ...prev,
            okButtonProps: { loading: true },
            cancelButtonProps: { disabled: true },
            closable: false,
            maskClosable: false,
            keyboard: false,
          }));

          mutate(
            { data: cropperRef.current!, config: config },
            {
              onSuccess(data) {
                modals.close(id);
                resolve(data);
              },
              onSettled(data) {
                modals.update(id, (prev) => ({
                  ...prev,
                  okButtonProps: { loading: false },
                  cancelButtonProps: { disabled: false },
                  closable: true,
                  maskClosable: true,
                  keyboard: true,
                }));
              },
            },
          );
        },
        onCancel() {
          mutate(
            { data: image!, config: config },
            {
              onSuccess(data) {
                modals.close(id);
                resolve(data);
              },
            },
          );
        },
      });
    });
  }, []);
  return open;
}

function useCrop() {
  return useMutation({
    mutationFn: async (param: {
      data: ReactCropperElement | Blob;
      config?: Pick<PreprocessImageFileOption, "fillColor" | "maxHeight" | "maxWidth">;
    }) => {
      const { data, config = {} } = param;
      const { fillColor, maxHeight, maxWidth } = config ?? {};
      await afterTime(2000);
      if (data instanceof Blob) {
        return preprocessImageFile(data, { fillColor, maxHeight, maxWidth });
      } else {
        const cropper = data.cropper;
        const image = cropper.getImageData();

        const canvas = cropper.getCroppedCanvas({
          fillColor,
          maxHeight: Math.min(maxHeight ?? Infinity, image.naturalHeight), // 限制最大高度不超过原图高度
          maxWidth: Math.min(maxWidth ?? Infinity, image.naturalWidth), // 限制最大宽度不超过原图宽度
        });

        return await preprocessCanvasImage(canvas);
      }
    },
  });
}

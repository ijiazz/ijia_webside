import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Image } from "antd";
import { GroupPreviewConfig } from "antd/es/image/PreviewGroup.js";
import { ImagePreviewType } from "antd/es/image/index.js";

export type ImagePreviewConfig = ImagePreviewType & { onClear?: () => void; url: string };
export type ImageGroupPreviewConfig = Omit<GroupPreviewConfig, "someProperty"> & {
  onClear?: () => void;
  initialIndex?: number;
  url: string[];
};
interface OpenFn {
  (images: ImagePreviewConfig): OpenResult;
  (images: ImageGroupPreviewConfig, initialIndex?: number): OpenResult;
}
type ImagePreviewContextType = {
  open: OpenFn;
  close(id: string): void;
};
type OpenResult = {
  id: string;
};

const ImagePreviewContext = createContext<ImagePreviewContextType>({
  open() {
    return { id: "0" };
  },
  close(id: string) {},
});

let modalIdCounter = 0;
function createModalId() {
  return `modal-${modalIdCounter++}`;
}

export function StaticImagePreviewProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<ImagePreviewConfig | ImageGroupPreviewConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const updateImage = useCallback((config: ImagePreviewConfig | ImageGroupPreviewConfig | null) => {
    setImages((prev) => {
      if (prev) {
        disposeImage(prev);
      }
      return config;
    });
  }, []);
  const open = useCallback((config: ImagePreviewConfig | ImageGroupPreviewConfig, initialIndex = 0): OpenResult => {
    updateImage(config);
    setCurrent(initialIndex);
    setVisible(true);
    const id = createModalId();
    return { id };
  }, []);
  const close = useCallback(() => {
    setVisible(false);
  }, []);
  const context = useMemo((): ImagePreviewContextType => ({ open, close }), [open, close]);

  const urls = useMemo(() => {
    if (!images) return [];
    return typeof images.url === "string" ? [images.url] : images.url;
  }, [images]);

  useEffect(() => {
    return () => {
      images && disposeImage(images);
    };
  }, [images]);

  const onOpenChange = (open: boolean, ...args: any[]) => {
    if (!open) {
      setVisible(false);
      //@ts-ignore
      images?.onOpenChange?.(false, ...args);
    }
  };
  const afterOpenChange = (open: boolean, ...args: any[]) => {
    if (!open) {
      //@ts-ignore
      images?.onOpenChange?.(true, ...args);
      updateImage(null);
    }
  };

  return (
    <ImagePreviewContext value={context}>
      {children}
      {images ? (
        typeof images.url === "string" ? (
          <Image
            src={images.url}
            style={{ display: "none" }}
            preview={{
              ...(images as ImagePreviewConfig),
              open: visible,
              onOpenChange: onOpenChange,
              afterOpenChange: afterOpenChange,
            }}
          />
        ) : (
          <Image.PreviewGroup
            preview={{
              ...(images as ImageGroupPreviewConfig),
              open: visible,
              current: current,
              onOpenChange: onOpenChange,
              afterOpenChange: afterOpenChange,
              onChange(current, prevCurrent) {
                (images as ImageGroupPreviewConfig).onChange?.(current, prevCurrent);
                setCurrent(current);
              },
            }}
          >
            {urls.map((src, i) => (
              <Image key={i} src={src} style={{ display: "none" }} />
            ))}
          </Image.PreviewGroup>
        )
      ) : null}
    </ImagePreviewContext>
  );
}
function disposeImage(config: ImagePreviewConfig | ImageGroupPreviewConfig) {
  if (config.onClear) {
    config.onClear(); // 执行清理
    config.onClear = undefined; // 避免重复调用
  }
}
export function useImagePreviewModal() {
  return useContext(ImagePreviewContext);
}

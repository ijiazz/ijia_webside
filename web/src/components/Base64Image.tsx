import { ImageProps, Image } from "antd";
import { useEffect, useMemo, useState } from "react";

export interface Base64ImageProps extends Omit<ImageProps, "src"> {
  data: string;
  type: string;
}

export function Base64Image(props: Base64ImageProps) {
  const { data, type, ...rest } = props;

  const blot = useMemo(() => {
    return new Blob([base64ToBin(data)], { type });
  }, [data, type]);

  const [url, setUrl] = useState<string>();

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blot);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blot]);

  return <Image {...rest} src={url} />;
}
function base64ToBin(data: string) {
  const byteCharacters = atob(data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Uint8Array(byteNumbers);
}

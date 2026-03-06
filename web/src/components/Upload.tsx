import { Upload as AntdUpload, UploadProps as AntdUploadProps } from "antd";
import { RcFile } from "antd/es/upload/interface.js";
import { FC } from "react";

type AntdCustomRequest = NonNullable<AntdUploadProps["customRequest"]>;
export type UploadRequestOption = Pick<
  Parameters<AntdCustomRequest>[0],
  "filename" | "onError" | "onProgress" | "onSuccess"
> & {
  file: Blob | RcFile;
};

/** 排除和上传相关的属性，使用自定义上传请求 */
export type UploadProps = Omit<
  AntdUploadProps,
  "action" | "method" | "data" | "headers" | "withCredentials" | "customRequest"
> & {
  customRequest: (option: UploadRequestOption) => void;
};
export const Upload: FC<UploadProps> = AntdUpload as FC<UploadProps>;

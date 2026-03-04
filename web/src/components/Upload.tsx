import { Upload as AntdUpload, UploadProps as AntdUploadProps } from "antd";
import { FC } from "react";
/** 排除和上传相关的属性，使用自定义上传请求 */
export type UploadProps = Omit<AntdUploadProps, "action" | "method" | "data" | "headers" | "withCredentials"> & {
  customRequest: NonNullable<AntdUploadProps["customRequest"]>;
};
export const Upload: FC<UploadProps> = AntdUpload;

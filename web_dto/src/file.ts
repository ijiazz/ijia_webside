import type { BlobLike } from "./common.ts";

export interface FileApi {
  /** 上传文件 */
  "PUT /upload/file": {
    query: { method: UploadMethod };
    body: BlobLike;
    response: UploadFileResult;
  };
}

export enum UploadMethod {
  /** 考试题目 */
  question = "question",
  /** 帖子 */
  post = "post",
  /** 头像 */
  avatar = "avatar",
}

export type UploadFileResult = {
  path: string;
  uploadFileKey: string;
};

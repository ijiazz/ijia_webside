import type { BlobLike, MediaType, ImageLevel } from "./common.ts";

export interface FileAPI {
  /** 上传文件 */
  "PUT /file/upload": {
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
  uploadFileKey: string;
};

export type UploadImageFileResult = UploadFileResult & {
  type: MediaType.image;
  image: {
    url: string;
    formats?: Record<ImageLevel, { url: string } | undefined>;
  };
};

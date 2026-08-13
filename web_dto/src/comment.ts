export * from "./comment/dto.ts";

import type {
  CreateCommentByPostIdInput,
  CreateCommentByPostIdResponse,
  GetCommentListInput,
  GetCommentListOutput,
} from "./comment/dto.ts";

export interface PostCommentApi {
  /** 发布评论  */
  "PUT /comment": {
    body: CreateCommentByPostIdInput;
    response: CreateCommentByPostIdResponse;
  };

  /** 获取评论列表 */
  "GET /comment/list": {
    response: GetCommentListOutput;
    query: GetCommentListInput;
  };

  /**
   * 删除评论
   * 只能删除自己的评论。
   */
  "DELETE /comment/:commentId": {
    params: { commentId: string };
  };

  /** 点赞评论 */
  "POST /comment/:commentId/like": {
    params: { commentId: string };
    query?: {
      isCancel?: boolean;
    };
    response: {
      success: boolean;
    };
  };
  /** 举报评论 */
  "POST /comment/:commentId/report": {
    params: { commentId: string };
    body?: {
      reason?: string;
    };
    response: {
      success: boolean;
    };
  };
}

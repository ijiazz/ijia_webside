import type { CursorListResult, TextStructure } from "../common.ts";

export type GetCommentListOutput = CursorListResult<CommentDTO, string> & { needLogin?: boolean };

export type GetCommentListOption = {
  number?: number;
  cursor?: string;
  /** 是否向前翻页 */
  forward?: boolean;
};

export type GetCommentListByCommentIdInput = GetCommentListOption & {
  /** 获取当前评论的信息 */
  commentId: number;
};
export type GetCommentListByPostIdInput = GetCommentListOption & {
  /** 获取指定作品的评论列表 */
  postId: number;
};

export type GetCommentListByParentCommentIdInput = GetCommentListOption & {
  /** 获取指定评论的回复列表 */
  parentCommentId: number;
};

export type GetCommentListInput =
  | GetCommentListByCommentIdInput
  | GetCommentListByPostIdInput
  | GetCommentListByParentCommentIdInput;

export type CommentDTO = {
  comment_id: number;
  root_comment_id: number | null;

  /** 如果 root_comment_id 为 null，则为0，否则表示该跟评论所有的回复数量 */
  is_root_reply_count: number;
  /** 直接回复当前评论的数量 */
  reply_count: number;

  post_id: number;
  create_time: number;
  content_text: string | null;
  content_text_structure: TextStructure[] | null;
  like_count: number;
  curr_user?: null | {
    is_like: boolean; // 是否点赞
    is_report: boolean; // 是否已举报
    can_update?: boolean; // 是否可以删除
  };
  reply_to?:
    | null
    | (Pick<CommentDTO, "user" | "comment_id"> & {
        is_deleted: boolean; // 是否已被删除
      });
  user: {
    user_id: number;
    user_name: string;
    avatar_url: string | null;
  };

  children?: CommentDTO[]; // 回复的评论
};

export type CreateCommentByPostIdInput = CreateCommentItemData & {
  postId: number;
};
export type CreateCommentItemData = {
  text: string;
  replyCommentId?: number;
};

export type CreateCommentByPostIdResponse = CreateCommentData;

export type CreateCommentData = {
  id: number;
};

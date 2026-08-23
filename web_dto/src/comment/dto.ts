import type { CursorListResult, TextStructure } from "../common.ts";

export type GetCommentListOutput = CursorListResult<CommentDTO, string> & { needLogin?: boolean };

export type GetCommentListInput = {
  number?: number;
  cursor?: string;
  /** 是否向前翻页 */
  forward?: boolean;

  /** 获取指定前评论的信息 */
  commentId?: string;
  /** 获取指定评论的回复列表 */
  parentCommentId?: string;
};

export type CommentDTO = {
  comment_tree_id: string;
  comment_id: string;
  root_comment_id: string | null;

  /** 如果 root_comment_id 为 null，则为0，否则表示该跟评论所有的回复数量 */
  is_root_reply_count: number;
  /** 直接回复当前评论的数量 */
  reply_count: number;

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
    user_id: string;
    user_name: string;
    avatar_url: string | null;
  };

  children?: CommentDTO[]; // 回复的评论
};

export type CreateCommentData = {
  text: string;
};
export type CreateCommentInput = CreateCommentData & {
  comment_tree_id: string;
  comment_reply_id?: string; // 回复的评论id
};

export type CreateCommentOutput = {
  comment_id: string;
};

import { CursorListDto } from "../common.ts";
import { TextStructure } from "../post/_dto/mod.ts";

export type PostCommentResponse = CursorListDto<PostCommentDto, string> & { needLogin?: boolean };

export type GetPostCommentListOption = {
  number?: number;
  cursor?: string;
  /** 是否向前翻页 */
  forward?: boolean;
};

export type GetPostCommentListByCommentIdParam = GetPostCommentListOption & {
  /** 获取当前评论的信息 */
  commentId: number;
};
export type GetPostCommentListByPostIdParam = GetPostCommentListOption & {
  /** 获取指定作品的评论列表 */
  postId: number;
};

export type GetPostCommentListByParentCommentIdParam = GetPostCommentListOption & {
  /** 获取指定评论的回复列表 */
  parentCommentId: number;
};

export type GetPostCommentListParam =
  | GetPostCommentListByCommentIdParam
  | GetPostCommentListByPostIdParam
  | GetPostCommentListByParentCommentIdParam;

export type PostCommentDto = {
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
    | (Pick<PostCommentDto, "user" | "comment_id"> & {
        is_deleted: boolean; // 是否已被删除
      });
  user: {
    user_id: number;
    user_name: string;
    avatar_url: string | null;
  };

  children?: PostCommentDto[]; // 回复的评论
};

export type CreatePostCommentParam = CreateCommentItemData & {
  postId: number;
};
export type CreateCommentItemData = {
  text: string;
  replyCommentId?: number;
};

export type CreatePostCommentResponse = CreateCommentData;

export type CreateCommentData = {
  id: number;
};

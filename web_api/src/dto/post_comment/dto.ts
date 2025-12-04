import { CursorListDto } from "../common.ts";
import { TextStructure } from "../post/_dto/mod.ts";

export type PostCommentResponse = CursorListDto<PostCommentDto, string> & { needLogin?: boolean };

export interface GetPostCommentListParam {
  number?: number;
  cursor?: string;
  forward?: boolean; // 是否向前翻页
  /** @deprecated */
  commentId?: number; // 如果指定了 commentId，则仅获取该评论的信息

  //TODO
  parentCommentId?: number; // 如果指定了 parentCommentId，则仅获取该评论的回复列表
}

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

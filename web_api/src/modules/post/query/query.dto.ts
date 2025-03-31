import { Platform } from "@ijia/data/db";

interface PageOption {
  pageSize?: number;
  page?: number;
}
type SortItem<T extends string> = { key: T; mode: "ASC" | "DESC" };

export interface UserSampleInfo {
  user_name: string;
  user_id: string;
}
export type GetUserParam = PageOption & {
  platform?: Platform;
  user_id?: string;
  s_user_name?: string;
};

export type UserItemDto = UserSampleInfo & {
  avatarUrl: string;
  ip_location: string | null;
};

type CommentSortKeys = "author_like" | "publish_time" | "like_count";
export type GetCommentListParam = PageOption & {
  asset_id?: string;
  platform?: Platform;

  s_user?: string;
  s_content?: string;

  sort?: Record<CommentSortKeys, "ASC" | "DESC">;
};
export type GetCommentReplyListParam = PageOption & {
  comment_id?: string;
  root_comment_id?: string;

  sort?: Record<CommentSortKeys, "ASC" | "DESC">;
};

export interface CommentRootItemDto {
  comment_id: string;
  comment_type: number;
  content_text: string;
  publish_time: Date;
  like_count: number;
  author_like: boolean;
  reply_total: number;

  user: UserSampleInfo;
  imageUrlList: string[] | null;
}
export interface CommentReplyItemDto extends CommentRootItemDto {
  parentId: number | null;
  replyUserName: string | null;
  replyUserId: string | null;
}

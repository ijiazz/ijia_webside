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

export type GetAssetListParam = PageOption & {
  platform?: Platform;
  userId?: string;
  s_content?: string;
  s_author?: string;

  sort?: Record<"publish_time" | "digg_total" | "forward_total" | "collection_num", "ASC" | "DESC">;
};
export interface AssetItemDto {
  asset_id: string;
  /** 作者信息 */
  author: UserSampleInfo;
  /** 作品类型 */
  type: number;
  /** 作品统计 */
  stat: {
    comment_total: number;
    digg_total: number;
    forward_total: number;
    collection_num: number;
  };
  content_text: string;
  cover: MulFormat<ImageInfoDto>;
  publish_time: Date | null;
  ip_location: string;

  //   videoList: VideoInfoDto[];
  //   audioList: AudioInfoDto[];
  //   imageList: ImageInfoDto[];
  videoUrlList?: string[];
  audioUrlList?: string[];
  imageUrlList?: string[];
}
export interface VideoInfoDto {
  url: string;
}
export interface AudioInfoDto {
  url: string;
}
export interface ImageInfoDto {
  //   width: number;
  //   height: number;
  url: string;
}
export interface MulFormat<T> {
  origin: T;
  thumb?: T;
}

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

import type { CursorListDto, TextStructure, AssetMediaUploadFile, ReviewStatus } from "../../common.ts";
import type { PostGroupInfo } from "./post_group.ts";
import type { PostBase, PostUserInfo } from "./common.ts";
export type GetPostResponse = {
  item: Post;
};
export type PostListResponse = CursorListDto<PublicPost, string> & { needLogin?: boolean };
export type PostUserResponse = CursorListDto<Post, string>;

type GetPostListBaseParam = {
  number?: number;
  /** timestamp-id */
  cursor?: string;
  /** 指针向前获取。 forward 只能获取 publish_time 不为空的数据 */
  forward?: boolean;
  post_id?: number;
  group_id?: number;

  s_content?: string;
  s_author?: string;
  userId?: string | number;
};
export type GetPostListParam = GetPostListBaseParam & {
  // sort?: Record<"digg_total" | "forward_total" | "collection_num", "ASC" | "DESC">;
};
export type GetUserPostListParam = GetPostListBaseParam;

export type CreatePostParam = {
  content_text?: string | null;
  content_text_structure?: TextStructure[] | null;
  media_file?: AssetMediaUploadFile[] | null;
  group_id?: number;
  /** 是否仅自己可见 */
  is_hide?: boolean;
  /** 是否匿名发布 */
  is_anonymous?: boolean;
  /** 是否关闭评论 */
  comment_disabled?: boolean;
};
export type UpdatePostContentParam = {
  type: "content";
  content_text?: string | null;
  content_text_structure?: TextStructure[] | null;
};
export type UpdatePostConfigParam = {
  type: "config";
  /** 是否仅自己可见 */
  is_hide?: boolean;
  /** 是否开启评论 */
  comment_disabled?: boolean;
};

export type PublicPost = PostBase & {
  post_id: number;
  /** 作者信息，如果为空则是匿名 */
  author: PostUserInfo | null;
  /** 当前请求用户的相关数据 */
  curr_user?: {
    can_update?: boolean; // 是否可以更新或删除
    can_comment?: boolean; // 是否可以评论
    disabled_comment_reason?: string; // 如果不能评论，原因是什么

    is_like: boolean; // 是否点赞
    is_report: boolean; // 是否已举报
  } | null;
  group?: PostGroupInfo | null;
  stat: {
    like_total: number;
    /** 举报人数。可能不是整数 */
    dislike_total: number;
    comment_total: number;
  };
};

type PostConfig = {
  /** 是否匿名 */
  is_anonymous?: boolean;
  /** 是否仅自己可见 */
  self_visible?: boolean;
  /** 是否关闭评论 */
  comment_disabled?: boolean;
};

export type Post = PublicPost & {
  config?: PostConfig;
  review?: {
    status?: ReviewStatus;
    remark?: string; // 审核结果评论
  };
};

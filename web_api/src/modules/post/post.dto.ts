import { TextStructure } from "@ijia/data/db";
import { CursorListDto, ListDto } from "../dto_common.ts";
import { AssetMediaDto, AssetMediaUploadFile } from "./common.dto.ts";

export type PostResponse = CursorListDto<PostItemDto, string> & { needLogin?: boolean };
export type PostAssetType = {
  hasText: boolean;
  hasImage: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
};

export type GetPostListParam = {
  number?: number;
  /** timestamp-id */
  cursor?: string;
  /** 指针向前获取。 forward 只能获取 publish_time 不为空的数据 */
  forward?: boolean;

  /** 是否仅获取当前用户的帖子。如果为 true，则包含自己隐藏的、审核中、审核不通过的帖子 */
  self?: boolean;

  post_id?: number;
  userId?: string | number;
  s_content?: string;
  s_author?: string;
  group_id?: number;

  // sort?: Record<"digg_total" | "forward_total" | "collection_num", "ASC" | "DESC">;
};

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

export type UpdatePostParam = {
  content_text?: string | null;
  content_text_structure?: TextStructure[] | null;
  /** 是否仅自己可见 */
  is_hide?: boolean;
  /** 是否开启评论 */
  comment_disabled?: boolean;
  media_file?: (AssetMediaUploadFile & { index: number })[];
};

export type PostGroupItem = {
  group_id: number;
  group_name: string;
  group_desc?: string;
  rule_desc?: string;
};
export type PostGroupResponse = ListDto<PostGroupItem>;

export type PostItemBase = {
  /** 作品类型 */
  type: PostAssetType;
  content_text: string | null;
  content_text_structure: TextStructure[] | null;
  publish_time?: string | null;
  update_time?: string | null;
  create_time?: string | null;
  ip_location: string | null;
  media: (AssetMediaDto | undefined)[];
};

export type PostItemDto = PostItemBase & {
  asset_id: number;
  /** 作者信息 */
  author: PostUserInfo | null;
  /** 当前请求用户的相关数据 */
  curr_user?: {
    can_update?: boolean; // 是否可以删除或删除
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
  status: {
    review_pass: null | boolean; // 是否审核通过 null: 未审核，true: 审核中，false: 生活不通过
    is_reviewing: boolean; // 是否正在审核
    reason?: string; // 审核不通过的原因
  };
  config: {
    /** 是否匿名 */
    is_anonymous?: boolean;
    /** 是否仅自己可见 */
    self_visible?: boolean;
    /** 是否关闭评论 */
    comment_disabled?: boolean;
  };
};

export type PostUserInfo = {
  user_name: string;
  user_id: string;
  avatar_url: string;
  home_page?: string;
};
export type PostGroupInfo = {
  group_id: string;
  group_name: string;
};
export type { TextStructure };

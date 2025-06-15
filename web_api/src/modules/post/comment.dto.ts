import { CursorListDto } from "../dto_common.ts";
import { TextStructure } from "./post.dto.ts";

export type PostCommentResponse = CursorListDto<PostComment, string> & { needLogin?: boolean; total?: number };

export interface GetPostCommentListParam {
  number?: number;
  cursor?: string;
  commentId?: number;
}

export type PostComment = {
  comment_id: number;
  root_comment_id: number | null;
  parent_comment_id: number | null;

  post_id: number;
  user_id: number;
  create_time: number;
  content_text: string | null;
  content_text_structure: TextStructure[] | null;
  like_count: number;
  curr_user?: null | {
    is_like: boolean; // 是否点赞
    is_report: boolean; // 是否已举报
  };
};

export interface CreatePostCommentParam {
  text: string;
  reply_comment_id?: number;
}

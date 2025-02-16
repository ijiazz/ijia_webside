import type { CommentStatByCount, UserLoginParamDto, UserLoginResultDto } from "./dto.ts";

export * from "./dto.ts";

export interface ApiDefined {
  /** 获取根评论数量排行榜 */
  "GET /stat/comment/count_by_user": {
    response: CommentStatByCount[];
    query: { page?: number; pageSize?: number };
  };
}
export interface ApiDefined {
  /** kd */
  "POST /user/login": {
    response: UserLoginResultDto;
    body: UserLoginParamDto;
  };
}

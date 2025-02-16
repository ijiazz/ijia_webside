import type {
  BindPlatformParam,
  CommentStatByCount,
  CreateUserProfileParam,
  CreateUserProfileResult,
  UserLoginParamDto,
  UserLoginResultDto,
  UserProfileDto,
} from "./dto.ts";

export * from "./dto.ts";

export interface ApiDefined {
  /** 获取根评论数量排行榜 */
  "GET /stat/comment/count_by_user": {
    response: CommentStatByCount[];
    query: { page?: number; pageSize?: number };
  };
}
export interface ApiDefined {
  /** 登录 */
  "POST /user/login": {
    response: UserLoginResultDto;
    body: UserLoginParamDto;
  };
  /** 注册用户 */
  "POST /user/self/profile": {
    response: CreateUserProfileResult;
    body: CreateUserProfileParam;
  };
  /** 获取用户基本信息 */
  "GET /user/self/profile": {
    response: UserProfileDto;
  };
  /** 绑定平台 */
  "POST /user/self/bind_platform": {
    response: null;
    body: BindPlatformParam;
  };
}

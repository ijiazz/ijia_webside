import type {
  BindPlatformParam,
  CommentStatByCount,
  CreateUserProfileParam,
  CreateUserProfileResult,
  UserLoginParamDto,
  UserLoginResultDto,
  UserProfileDto,
  ImageCaptchaQuestion,
  EmailCaptchaQuestion,
  ImageCaptchaReply,
  RequestSignupEmailCaptchaParam,
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
  "POST /user/signup": {
    response: CreateUserProfileResult;
    body: CreateUserProfileParam;
  };
  /** 注册用户发送邮箱验证码 */
  "POST /user/signup/email_captcha": {
    response: EmailCaptchaQuestion;
    body: RequestSignupEmailCaptchaParam;
  };

  /** 绑定平台 */
  "POST /user/self/bind_platform": {
    response: null;
    body: BindPlatformParam;
  };

  /** 获取用户基本信息 */
  "GET /user/self/profile": {
    response: UserProfileDto;
  };
}

export interface ApiDefined {
  /** 创建或刷新验证码会话 */
  "POST /captcha/image": {
    response: ImageCaptchaQuestion;
    params?: {
      sessionId?: string;
    };
  } /** 获取图像验证码文件流 */;
  "POST /captcha/image/:url": {};
}

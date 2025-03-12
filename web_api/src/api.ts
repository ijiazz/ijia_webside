import type {
  BindPlatformCheckParam,
  CommentStatByCount,
  CreateUserProfileParam,
  CreateUserProfileResult,
  UserLoginParamDto,
  UserLoginResultDto,
  UserProfileDto,
  ImageCaptchaQuestion,
  EmailCaptchaQuestion,
  RequestSignupEmailCaptchaParam,
  ListDto,
  ClassOption,
  BindPlatformCheckDto,
  BindPlatformParam,
  UpdateUserProfileParam,
  DeleteBindPlatformParam,
} from "./modules/dto.ts";

export * from "./modules/dto.ts";

export interface ApiDefined {
  /** 获取根评论数量排行榜 */
  "GET /stat/comment/count_by_user": {
    response: CommentStatByCount[];
    query: { page?: number; pageSize?: number };
  };
}

export interface ApiDefined {
  /** 登录 */
  "POST /passport/login": {
    response: UserLoginResultDto;
    body: UserLoginParamDto;
  };
  /** 注册用户 */
  "POST /passport/signup": {
    response: CreateUserProfileResult;
    body: CreateUserProfileParam;
  };
  /** 注册用户发送邮箱验证码 */
  "POST /passport/signup/email_captcha": {
    response: EmailCaptchaQuestion;
    body: RequestSignupEmailCaptchaParam;
  };
}
export interface ApiDefined {
  /** 绑定平台 */
  "POST /user/bind_platform": {
    response: null;
    body: BindPlatformParam;
  };
  /** 解除平台绑定 */
  "DELETE /user/bind_platform": {
    response: null;
    body: DeleteBindPlatformParam;
  };
  /** 绑定平台前检测是否能够绑定 */
  "POST /user/bind_platform/check": {
    response: BindPlatformCheckDto;
    body: BindPlatformCheckParam;
  };

  /** 获取用户基本信息 */
  "GET /user/profile": {
    response: UserProfileDto;
  };
  /** 修改用户信息 */
  "PATCH /user/profile": {
    response: null;
    body: UpdateUserProfileParam;
  };
}

export interface ApiDefined {
  /** 获取公共班级列表 */
  "GET /class/public": {
    response: ListDto<ClassOption>;
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

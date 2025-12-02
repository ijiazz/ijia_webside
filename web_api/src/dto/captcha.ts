export interface CaptchaApi {
  /** 创建或刷新验证码会话 */
  "POST /captcha/image": {
    response: ImageCaptchaQuestion;
    query?: {
      sessionId?: string;
    };
  };
  /** 获取图像验证码文件流 */
  "GET /captcha/image/:url": {
    response: Uint8Array;
  };

  /** 发送邮箱验证码 */
  "POST /captcha/email/send": {
    body: SendEmailCaptchaParam;
    response: EmailCaptchaQuestion;
  };
}

export type CaptchaOption = {
  /** 有效时间. 单位秒 */
  survivalTime: number;
};

export type ImageCaptchaQuestion = CaptchaOption & {
  title: string;
  sessionId: string;
  imageUrlList: string[];
};

export type ImageCaptchaReply = {
  sessionId: string;
  selectedIndex: number[];
};
export type EmailCaptchaReply = {
  sessionId: string;
  code: string;
};
export type EmailCaptchaQuestion = CaptchaOption & {
  title: string;
  sessionId: string;
};
export type VerificationCodeResult = {};

export type SendEmailCaptchaParam = {
  /** 人机判定回答 */
  captchaReply: ImageCaptchaReply;
  email: string;
  actionType: EmailCaptchaActionType;
};

export enum EmailCaptchaActionType {
  signup = "signup",
  changeEmail = "changeEmail",
  /** 更换邮箱 */
  signAccountToken = "signAccountToken",
  resetPassword = "resetPassword",
}

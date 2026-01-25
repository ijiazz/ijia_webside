import type { EmailCaptchaReply, ImageCaptchaReply } from "../captcha.ts";

export type CreateUserProfileParam = {
  email: string;
  emailCaptcha?: EmailCaptchaReply;
  password?: string;
  passwordNoHash?: boolean;
};
export type CreateUserProfileResult = {
  userId: number;
  jwtKey: string;
};

export type UserLoginResult = {
  success: boolean;
  token: string;
  maxAge: number | null;
  message?: string;
  redirect?: string;
  tip?: {
    title: string;
    content: string;
  };
};
export enum UserIdentifierType {
  userId = "userId",
  email = "email",
}
export type LoginUserIdentifier =
  | {
      userId: number;
      type: UserIdentifierType.userId;
    }
  | {
      email: string;
      type: UserIdentifierType.email;
    };

export type UserLoginCommonParam = {
  /** 如果为 true, 则保留用户登录状态，否则关闭窗口后需要重新登录 */
  keepLoggedIn?: boolean;
};
export type UserLoginByPasswordParam = {
  method: LoginMethod.password;
  captcha?: ImageCaptchaReply;
  user: LoginUserIdentifier;
  password?: string;
  passwordNoHash?: boolean;
};
export type UserLoginByEmailCaptchaParam = {
  method: LoginMethod.emailCaptcha;
  email: string;
  emailCaptcha: EmailCaptchaReply;
};

export type UserLoginParam = UserLoginCommonParam & (UserLoginByEmailCaptchaParam | UserLoginByPasswordParam);

export enum LoginMethod {
  password = "password",
  emailCaptcha = "email_captcha",
}

export type ChangePasswordParam = {
  newPassword: string;
  oldPassword: string;
  passwordNoHash?: boolean;
};

export type ResetPasswordParam = {
  email: string;
  emailCaptcha: EmailCaptchaReply;
  newPassword: string;
  passwordNoHash?: boolean;
};

export type PassportConfig = {
  signupTip?: string | null;
  /** 是否开启注册 */
  signupEnabled?: boolean | null;

  /** 登录关闭验证码 */
  loginCaptchaDisabled?: boolean | null;
  loginTip?: string | null;
};

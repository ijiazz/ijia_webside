import { user } from "@ijia/data/db";
import { dbPool } from "@ijia/data/dbclient";
import { emailCaptchaService, CaptchaEmail } from "./Email.service.ts";
import { createEmailCodeHtmlContent } from "./signup-email-code.ts";
import { appConfig } from "@/config.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { EmailCaptchaActionType, EmailCaptchaQuestion } from "@/dto/captcha.ts";

export async function sendSignUpEmailCaptcha(email: string): Promise<EmailCaptchaQuestion> {
  const code = emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    message: `HI! 您正在注册 ${appConfig.appName}账号`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    type: EmailCaptchaActionType.signup,
    expire,
    code,
    recipient: email,
    html: htmlContent,
  };

  return emailCaptchaService.sendEmailCaptcha(captchaEmail);
}
export async function sendResetPassportCaptcha(email: string) {
  const code = emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    message: `您正在尝试重置密码，如果不是您本人在操作，请忽略`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    type: EmailCaptchaActionType.resetPassword,
    expire,
    code,
    recipient: email,
    html: htmlContent,
  };

  return emailCaptchaService.sendEmailCaptcha(captchaEmail);
}
export async function sendChangeEmailCaptcha(newEmail: string) {
  const code = emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    message: `您正在修改邮箱，如果不是您本人在操作，请忽略`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    type: EmailCaptchaActionType.changeEmail,
    expire,
    code,
    recipient: newEmail,
    html: htmlContent,
  };

  return emailCaptchaService.sendEmailCaptcha(captchaEmail);
}
export async function sendAccountAuthEmailCaptcha(email: string) {
  const code = emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    message: `您正在认证邮箱，如果不是您本人在操作，请忽略。请不要在 ${expire} 秒内泄露此验证码，以免账号被他人盗用`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    type: EmailCaptchaActionType.signAccountToken,
    expire,
    code,
    recipient: email,
    html: htmlContent,
  };

  return emailCaptchaService.sendEmailCaptcha(captchaEmail);
}
// 有一些需要用户有效
export async function checkEmailExists(email: string): Promise<number | undefined> {
  const [account] = await select<{ email: string; id: number }>({ email: true, id: true })
    .from(user.name)
    .where(`email=${v(email)}`)
    .limit(1)
    .dataClient(dbPool)
    .queryRows();
  return account?.id;
}

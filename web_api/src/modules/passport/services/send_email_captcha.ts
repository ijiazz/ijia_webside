import { user } from "@ijia/data/db";
import v from "@ijia/data/yoursql";
import { emailCaptchaService, CaptchaEmail, EmailCaptchaQuestion, EmailCaptchaType } from "../../captcha/mod.ts";
import { createEmailCodeHtmlContent } from "../template/sigup-email-code.ts";
import { appConfig } from "@/config.ts";
import { HttpError } from "@/global/errors.ts";

export async function sendSignUpEmailCaptcha(email: string): Promise<EmailCaptchaQuestion> {
  const exists = await user
    .select({ email: true })
    .where(`email=${v(email)}`)
    .limit(1)
    .queryCount();
  if (exists) throw new HttpError(406, "邮箱已被注册");

  const code = emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    title: `HI! 您正在使用 ${email} 注册 ${appConfig.appName}账号`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    type: EmailCaptchaType.signup,
    expire,
    code,
    recipient: email,
    title: `${appConfig.appName}验证码: ${code}`,
    html: htmlContent,
  };

  return emailCaptchaService.sendEmailCaptcha(captchaEmail);
}
export async function sendResetPassportCaptcha(email: string, userId: number) {
  const code = emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    title: `您的账号 ${email} （学号为 ${userId}） 正在尝试重置密码，如果不是您本人在操作，请忽略`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    type: EmailCaptchaType.resetPassword,
    expire,
    code,
    recipient: email,
    title: `${appConfig.appName}验证码: ${code}`,
    html: htmlContent,
  };

  return emailCaptchaService.sendEmailCaptcha(captchaEmail);
}
export async function sendChangeEmailCaptcha(newEmail: string, userId: number) {
  const [count] = await user
    .select<{ count: number }>("count(*)::INT")
    .where(`email=${v(newEmail)}`)
    .queryRows();
  if (count.count) throw new HttpError(406, "邮箱已被注册");

  const code = emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    title: `您的账号 ${newEmail} （学号为 ${userId}） 正在修改邮箱，如果不是您本人在操作，请忽略`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    type: EmailCaptchaType.changeEmail,
    expire,
    code,
    recipient: newEmail,
    title: `${appConfig.appName}验证码: ${code}`,
    html: htmlContent,
  };

  return emailCaptchaService.sendEmailCaptcha(captchaEmail);
}
export async function sendAccountAuthEmailCaptcha(email: string, userId: number) {
  const code = emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    title: `您的账号 ${email} （学号为 ${userId}） 正在认证邮箱，如果不是您本人在操作，请忽略`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    type: EmailCaptchaType.verifyAccountEmail,
    expire,
    code,
    recipient: email,
    title: `${appConfig.appName}验证码: ${code}`,
    html: htmlContent,
  };

  return emailCaptchaService.sendEmailCaptcha(captchaEmail);
}

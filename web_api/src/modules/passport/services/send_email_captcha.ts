import { user } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import { emailCaptchaService, CaptchaEmail, EmailCaptchaQuestion, EmailCaptchaType } from "../../captcha/mod.ts";
import { createEmailCodeHtmlContent } from "../template/sigup-email-code.ts";
import { ENV, appConfig, RunMode } from "@/config.ts";
import { HttpError } from "@/global/errors.ts";

async function sendEmailCaptcha(type: EmailCaptchaType, captchaEmail: CaptchaEmail, code: string) {
  let emailCaptchaQuestion: EmailCaptchaQuestion;
  if (ENV.IS_PROD) {
    emailCaptchaQuestion = await emailCaptchaService.sendEmailCaptcha(captchaEmail, type);
  } else {
    if (ENV.MODE === RunMode.Dev) console.log("模拟发送邮件验证码：" + code, captchaEmail);
    emailCaptchaQuestion = await emailCaptchaService.createSession(captchaEmail, type);
  }
  return emailCaptchaQuestion;
}
export async function sendSignUpEmailCaptcha(email: string): Promise<EmailCaptchaQuestion> {
  const exists = await user
    .select({ email: true })
    .where(`email=${v(email)}`)
    .limit(1)
    .queryCount();
  if (exists) throw new HttpError(406, "邮箱已被注册");

  const code = ENV.IS_TEST ? "1234" : emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    title: `HI! 您正在使用 ${email} 注册 ${appConfig.appName}账号`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    expire,
    code,
    recipient: email,
    title: `${appConfig.appName}验证码: ${code}`,
    text: htmlContent,
  };

  return sendEmailCaptcha(EmailCaptchaType.signup, captchaEmail, code);
}
export async function sendResetPassportCaptcha(email: string) {
  const [account] = await user
    .select<{ email: string; id: number }>({ email: true, id: true })
    .where(`email=${v(email)}`)
    .limit(1)
    .queryRows();
  if (!account) throw new HttpError(406, "用户不存在");

  const code = ENV.IS_TEST ? "1234" : emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    title: `您的账号 ${email} （学号为 ${account.id}） 正在尝试重置密码，如果不是您本人在操作，请忽略`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    expire,
    code,
    recipient: email,
    title: `${appConfig.appName}验证码: ${code}`,
    text: htmlContent,
  };

  return sendEmailCaptcha(EmailCaptchaType.resetPassword, captchaEmail, code);
}
export async function sendChangeEmailCaptcha(email: string, userId: number) {
  const getUser = user
    .select<{ email: string; id: number }>({ email: true, id: true })
    .where(`id=${v(userId)}`)
    .limit(1);
  const checkNewEmail = user.select("count(*)::INT").where(`email=${v(email)}`);

  const [[account], [count]] = await dbPool.multipleQueryRows(getUser + ";" + checkNewEmail);
  if (!account) throw new HttpError(406, "用户不存在");
  if (count.count) throw new HttpError(406, "邮箱已被注册");

  const code = ENV.IS_TEST ? "1234" : emailCaptchaService.genCode();
  const expire = 5 * 60; // 5 分钟有效期
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    title: `您的账号 ${userId} （学号为 ${account.id}） 正在修改邮箱，如果不是您本人在操作，请忽略`,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    expire,
    code,
    recipient: email,
    title: `${appConfig.appName}验证码: ${code}`,
    text: htmlContent,
  };

  return sendEmailCaptcha(EmailCaptchaType.changeEmail, captchaEmail, code);
}

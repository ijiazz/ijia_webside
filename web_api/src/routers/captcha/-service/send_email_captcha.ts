import { dbPool } from "@/db/client.ts";
import { emailCaptchaService, CaptchaEmail } from "./Email.service.ts";
import { createEmailCodeHtmlContent } from "./signup-email-code.ts";
import { appConfig } from "@/config.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { EmailCaptchaActionType, EmailCaptchaQuestion } from "@/dto.ts";

export async function sendSignUpEmailCaptcha(email: string): Promise<EmailCaptchaQuestion> {
  const expire = 5 * 60; // 5 分钟有效期
  return sendEmailCaptcha(email, EmailCaptchaActionType.signup, expire, `HI! 您正在注册 ${appConfig.appName}账号`);
}
export async function sendResetPassportCaptcha(email: string) {
  const expire = 5 * 60; // 5 分钟有效期

  return sendEmailCaptcha(
    email,
    EmailCaptchaActionType.resetPassword,
    expire,
    `您正在尝试重置密码，如果不是您本人在操作，请忽略`,
  );
}
export async function sendChangeEmailCaptcha(newEmail: string) {
  const expire = 5 * 60; // 5 分钟有效期

  return sendEmailCaptcha(
    newEmail,
    EmailCaptchaActionType.changeEmail,
    expire,
    `您正在修改邮箱，如果不是您本人在操作，请忽略`,
  );
}
export async function sendAccountAuthEmailCaptcha(email: string) {
  const expire = 5 * 60; // 5 分钟有效期

  return sendEmailCaptcha(
    email,
    EmailCaptchaActionType.signAccountToken,
    expire,
    `您正在认证邮箱，如果不是您本人在操作，请忽略。请不要在 ${expire} 秒内泄露此验证码，以免账号被他人盗用`,
  );
}

async function sendEmailCaptcha(
  email: string,
  actionType: EmailCaptchaActionType,
  expire: number,
  message: string,
): Promise<EmailCaptchaQuestion> {
  const code = emailCaptchaService.genCode();
  const htmlContent = createEmailCodeHtmlContent({
    code,
    time: expire,
    message: message,
    appName: appConfig.appName,
  });
  const captchaEmail: CaptchaEmail = {
    type: actionType,
    expire,
    code,
    recipient: email,
    html: htmlContent,
  };

  return emailCaptchaService.sendEmailCaptcha(captchaEmail);
}

// 有一些需要用户有效
export async function checkEmailExists(email: string): Promise<number | undefined> {
  const [account] = await dbPool.queryRows(
    select<{ email: string; id: number }>({ email: true, id: true })
      .from("public.user")
      .where(`email=${v(email)}`)
      .limit(1),
  );
  return account?.id;
}

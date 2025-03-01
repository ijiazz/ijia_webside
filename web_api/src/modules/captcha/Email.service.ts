import { SessionManager } from "./_SessionManage.ts";
import { EmailCaptchaReply } from "./Captcha.type.ts";
import { getEmailSender } from "@/lib/email.ts";

//TODO 邮件验证码服务
class CaptchaService {
  constructor() {}
  genCode() {
    const code = Math.floor(Math.random() * 1000000); // 6 位数字
    return code.toString();
  }
  readonly session = new SessionManager<EmailCaptchaSessionData>("Captcha:code", 5 * 60);
  async sendEmailCaptcha(config: EmailConfig) {
    await getEmailSender().sendEmail({
      targetEmail: config.email,
      title: config.title,
      html: config.html,
      text: config.text,
    });
    const sessionId = await this.session.set({ code: config.code, email: config.email }, { EX: config.expire });
    return {
      sessionId,
      survivalTime: this.session.expire,
    };
  }
  async verify(reply: EmailCaptchaReply): Promise<boolean> {
    const data = await this.session.take(reply.sessionId);
    if (!data) return false;
    return data.code === reply.code;
  }
}

export const emailCaptchaService = new CaptchaService();

type EmailConfig = {
  /** 过期时间 */
  expire: number;
  code: string;
  email: string;
  title?: string;
  text?: string;
  html?: string;
};

type EmailCaptchaSessionData = {
  code: string;
  email: string;
};

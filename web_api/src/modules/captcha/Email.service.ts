import { SessionManager } from "./_SessionManage.ts";
import { EmailCaptchaQuestion, EmailCaptchaReply } from "./Captcha.type.ts";
import { getEmailSender } from "@/services/email.ts";

class EmailCaptchaService {
  constructor() {}
  genCode() {
    const code = Math.floor(Math.random() * 1000000); // 6 位数字
    return code.toString();
  }
  readonly session = new SessionManager<EmailCaptchaSessionData>("Captcha:code", 5 * 60);
  async sendEmailCaptcha(config: CaptchaEmail) {
    await getEmailSender().sendEmail({
      targetEmail: config.recipient,
      title: config.title,
      html: config.html,
      text: config.text,
    });
    return this.createSession(config);
  }
  async createSession(config: CaptchaEmail): Promise<EmailCaptchaQuestion> {
    const sessionId = await this.session.set({ code: config.code, email: config.recipient }, { EX: config.expire });
    return {
      title: "请输入邮箱验证码",
      sessionId,
      survivalTime: this.session.expire,
    };
  }
  async getAnswer(sessionId: string) {
    return this.session.get(sessionId);
  }
  async verify(reply: EmailCaptchaReply): Promise<boolean> {
    const data = await this.session.get(reply.sessionId);
    if (!data) return false;
    await this.session.delete(reply.sessionId);
    return data.code === reply.code;
  }
}

export const emailCaptchaService = new EmailCaptchaService();

export type CaptchaEmail = {
  /** 过期时间 */
  expire: number;
  code: string;
  recipient: string;
  title?: string;
  text?: string;
  html?: string;
};

type EmailCaptchaSessionData = {
  code: string;
  email: string;
};

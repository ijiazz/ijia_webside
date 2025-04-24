import { ENV, RunMode } from "@/config.ts";
import { SessionManager } from "./_SessionManage.ts";
import { EmailCaptchaQuestion, EmailCaptchaReply } from "./captcha.dto.ts";
import { getEmailSender } from "@/services/email.ts";

class EmailCaptchaService {
  constructor() {}
  genCode() {
    if (ENV.IS_TEST) return "1234";

    const code = Math.floor(Math.random() * 1000000); // 6 位数字
    return code.toString();
  }
  readonly session = new SessionManager<EmailCaptchaSessionData>("Captcha:code", 5 * 60);
  async #sendEmailCaptcha(config: CaptchaEmail) {
    await getEmailSender().sendEmail({
      targetEmail: config.recipient,
      title: config.title,
      html: config.html,
      text: config.text,
    });
    return this.createSession(config);
  }
  async sendEmailCaptcha(captchaEmail: CaptchaEmail) {
    if (ENV.IS_PROD) {
      return this.#sendEmailCaptcha(captchaEmail);
    } else {
      if (ENV.MODE === RunMode.Dev) console.log("模拟发送邮件验证码：" + captchaEmail.code, captchaEmail);
      return this.createSession(captchaEmail);
    }
  }
  async createSession(config: CaptchaEmail): Promise<EmailCaptchaQuestion> {
    const sessionId = await this.session.set(
      { code: config.code, email: config.recipient, type: config.type },
      { EX: config.expire },
    );
    return {
      title: "请输入邮箱验证码",
      sessionId,
      survivalTime: this.session.expire,
    };
  }
  async getAnswer(sessionId: string) {
    return this.session.get(sessionId);
  }
  async verify(reply: EmailCaptchaReply, email: string, type: EmailCaptchaType): Promise<boolean> {
    const data = await this.session.get(reply.sessionId);
    if (!data) return false;
    const pass = data.code === reply.code && data.email === email && data.type === type;
    if (pass) await this.session.delete(reply.sessionId);
    return pass;
  }
}

export enum EmailCaptchaType {
  signup = "signup",
  resetPassword = "resetPassword",
  changeEmail = "changeEmail",
  verifyAccountEmail = "verifyAccountEmail",
}

export const emailCaptchaService = new EmailCaptchaService();

export type CaptchaEmail = {
  type: EmailCaptchaType;
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
  type: EmailCaptchaType;
};

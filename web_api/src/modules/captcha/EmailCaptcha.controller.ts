import { EmailCaptchaReply } from "./Captcha.type.ts";

//TODO 邮件验证码服务
class EmailCaptchaController {
  async emailCreateSession(config: { email: string; content: string; prefix: string }): Promise<string> {
    throw new Error("未实现");
  }
  async verify(reply: EmailCaptchaReply): Promise<boolean> {
    throw new Error("未实现");
  }
}

export const emailCaptchaController = new EmailCaptchaController();

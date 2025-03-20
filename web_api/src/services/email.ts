import { createTransport, Transporter } from "nodemailer";
import { EmailConfig, appConfig } from "@/config.ts";

export class EmailSender {
  private readonly emailSender: Transporter;
  private readonly form: { name: string; address: string };
  constructor(config: EmailConfig) {
    this.emailSender = createTransport({
      //@ts-ignore
      pool: true,
      host: config.serverHost,
      port: config.serverPort,
      auth: config.auth
        ? {
            type: "login",
            user: config.auth.user,
            pass: config.auth.password,
          }
        : undefined,
    });
    this.form = { address: config.emailFrom, name: config.senderName };
  }
  async sendEmail(option: SendMailOption) {
    await this.emailSender.sendMail({
      from: this.form,
      to: option.targetEmail,
      subject: option.title,
      html: option.html,
      text: option.text,
    });
    console.log("已发送");
  }
}

let emailSender: EmailSender | undefined;

export function getEmailSender() {
  if (!emailSender) {
    if (!appConfig.emailSender) {
      throw new Error("未设置邮件服务");
    }
    emailSender = new EmailSender(appConfig.emailSender);
  }
  return emailSender;
}
export type SendMailOption = {
  targetEmail: string | { name: string; address: string };
  title?: string;
  html?: string;
  text?: string;
};

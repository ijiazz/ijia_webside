import { SendSelfEmailCaptchaParam, SendEmailCaptchaParam } from "@/dto/captcha.ts";
import { createCaptchaSession } from "../../../__mocks__/captcha.ts";
import { emailCaptchaService } from "@/routers/captcha/mod.ts";
import { Api, JWT_TOKEN_KEY } from "../../../fixtures/hono.ts";

export async function mockSendEmailCaptcha(api: Api, email: string, type: SendEmailCaptchaParam["actionType"]) {
  const captchaReply = await createCaptchaSession();
  const { sessionId } = await api["/captcha/email/send"].post({
    body: { captchaReply, email: email, actionType: type },
  });
  const emailAnswer = await emailCaptchaService.getAnswer(sessionId);

  return { code: emailAnswer!.code, sessionId };
}
export async function mockSendSelfEmailCaptcha(api: Api, token: string, type: SendSelfEmailCaptchaParam["actionType"]) {
  const captchaReply = await createCaptchaSession();
  const { sessionId } = await api["/captcha/email/send_self"].post({
    body: { captchaReply, actionType: type },
    [JWT_TOKEN_KEY]: token,
  });
  const emailAnswer = await emailCaptchaService.getAnswer(sessionId);

  return { code: emailAnswer!.code, sessionId };
}

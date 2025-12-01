import routeGroup from "../_route.ts";
import { checkValue, emailChecker } from "@/global/check.ts";
import { imageCaptchaReplyChecker, imageCaptchaController } from "@/routers/captcha/mod.ts";
import { HttpCaptchaError } from "@/global/errors.ts";
import { sendSignUpEmailCaptcha } from "../-services/send_email_captcha.ts";
import { RequestSendEmailCaptchaParam } from "@/dto/passport.ts";
import { EmailCaptchaQuestion } from "@/dto/captcha.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/signup/email_captcha",
  async validateInput(ctx) {
    const body = await ctx.req.json();
    return checkValue(body, {
      captchaReply: imageCaptchaReplyChecker(),
      email: emailChecker,
    });
  },
  async handler({ captchaReply, email }: RequestSendEmailCaptchaParam): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaController.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();
    return sendSignUpEmailCaptcha(email);
  },
});

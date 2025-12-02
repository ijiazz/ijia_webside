import routeGroup from "../_route.ts";
import { checkValue, emailChecker } from "@/global/check.ts";
import { imageCaptchaReplyChecker, imageCaptchaService } from "@/routers/captcha/mod.ts";
import { HttpCaptchaError, HttpError } from "@/global/errors.ts";
import { checkEmailExists, sendSignUpEmailCaptcha } from "../../captcha/-service/send_email_captcha.ts";
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
    const pass = await imageCaptchaService.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();

    const account = await checkEmailExists(email);
    if (account !== undefined) throw new HttpError(406, "邮箱已被注册");

    return sendSignUpEmailCaptcha(email);
  },
});

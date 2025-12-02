import { HttpCaptchaError, HttpError } from "@/global/errors.ts";
import { checkValueAsync, emailChecker } from "@/global/check.ts";
import { EmailCaptchaQuestion } from "@/dto/captcha.ts";
import routeGroup from "../_route.ts";
import { imageCaptchaService, imageCaptchaReplyChecker } from "@/routers/captcha/mod.ts";
import { checkEmailExists, sendChangeEmailCaptcha } from "../../captcha/-service/send_email_captcha.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/change_email/email_captcha",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const body = await checkValueAsync(ctx.req.json(), {
      captchaReply: imageCaptchaReplyChecker(),
      email: emailChecker,
    });
    return { userId, ...body };
  },
  async handler({ captchaReply, email }): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaService.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();

    const account = await checkEmailExists(email);
    if (account !== undefined) throw new HttpError(406, "邮箱已被注册");
    return sendChangeEmailCaptcha(email);
  },
});

import { HttpCaptchaError } from "@/global/errors.ts";
import { checkValueAsync, emailChecker } from "@/global/check.ts";
import { EmailCaptchaQuestion } from "@/dto/captcha.ts";
import routeGroup from "../_route.ts";
import { imageCaptchaService, imageCaptchaReplyChecker } from "@/routers/captcha/mod.ts";
import { sendChangeEmailCaptcha } from "../-services/send_email_captcha.ts";

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
  async handler({ captchaReply, email, userId }): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaService.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();
    return sendChangeEmailCaptcha(email, userId);
  },
});

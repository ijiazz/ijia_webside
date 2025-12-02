import { HttpCaptchaError } from "@/global/errors.ts";
import { checkValueAsync } from "@/global/check.ts";
import routeGroup from "../_route.ts";
import { UserInfo } from "@/middleware/auth.ts";
import { ImageCaptchaReply } from "@/dto/captcha.ts";
import { imageCaptchaService, imageCaptchaReplyChecker } from "@/routers/captcha/mod.ts";
import { sendAccountAuthEmailCaptcha } from "../../captcha/-service/send_email_captcha.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/sign_account_token/email_captcha",
  async validateInput(ctx) {
    const param = await checkValueAsync(ctx.req.json(), {
      captchaReply: imageCaptchaReplyChecker(),
    });
    const params: {
      user: UserInfo;
      captchaReply: ImageCaptchaReply;
    } = { user: ctx.get("userInfo"), captchaReply: param.captchaReply };
    return params;
  },
  async handler({ user, captchaReply }) {
    const pass = await imageCaptchaService.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();
    const userInfo = await user.getValidUserSampleInfo();
    return sendAccountAuthEmailCaptcha(userInfo.email);
  },
});

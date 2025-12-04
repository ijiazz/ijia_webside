import routeGroup from "../_route.ts";
import { checkValueAsync } from "@/global/check.ts";
import { HttpCaptchaError, HttpError } from "@/global/errors.ts";
import { EmailCaptchaActionType, EmailCaptchaQuestion, SendSelfEmailCaptchaParam } from "@/dto/captcha.ts";
import { enumType, ExpectType } from "@asla/wokao";
import { sendAccountAuthEmailCaptcha } from "../-service/send_email_captcha.ts";
import { imageCaptchaService } from "../-service/ImageCaptcha.service.ts";
import { imageCaptchaReplyChecker } from "../-utils/check.ts";

const inputSchema = {
  captchaReply: imageCaptchaReplyChecker(),
  actionType: enumType([EmailCaptchaActionType.signAccountToken] as const), // just for type check
} satisfies ExpectType;

export default routeGroup.create({
  method: "POST",
  routePath: "/captcha/email/send_self",
  validateInput(ctx): Promise<SendSelfEmailCaptchaParam> {
    return checkValueAsync(ctx.req.json(), inputSchema);
  },
  async handler({ captchaReply, actionType }: SendSelfEmailCaptchaParam, ctx): Promise<EmailCaptchaQuestion> {
    const userInfo = ctx.get("userInfo");
    const email = await userInfo.getValidUserSampleInfo().then((u) => u.email); //需要当前用户有效
    const pass = await imageCaptchaService.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();

    switch (actionType) {
      case EmailCaptchaActionType.signAccountToken: {
        //需要目标邮箱对应的账户存在
        return sendAccountAuthEmailCaptcha(email);
      }
      default:
        throw new HttpError(400, "不支持的操作类型");
    }
  },
});

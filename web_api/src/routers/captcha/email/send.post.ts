import routeGroup from "../_route.ts";
import { checkValueAsync, emailChecker } from "@/global/check.ts";
import { HttpCaptchaError, HttpError } from "@/global/errors.ts";
import { EmailCaptchaActionType, EmailCaptchaQuestion, SendEmailCaptchaParam } from "@/dto.ts";
import { enumType, ExpectType } from "@asla/wokao";
import {
  checkEmailExists,
  sendChangeEmailCaptcha,
  sendEmailCaptcha,
  sendResetPassportCaptcha,
  sendSignUpEmailCaptcha,
} from "../-service/send_email_captcha.ts";
import { imageCaptchaService } from "../-service/ImageCaptcha.service.ts";
import { imageCaptchaReplyChecker } from "../-utils/check.ts";

const inputSchema = {
  captchaReply: imageCaptchaReplyChecker(),
  email: emailChecker,
  actionType: enumType([
    EmailCaptchaActionType.changeEmail,
    EmailCaptchaActionType.signup,
    EmailCaptchaActionType.resetPassword,
    EmailCaptchaActionType.login,
  ] as const), // just for type check
} satisfies ExpectType;

export default routeGroup.create({
  method: "POST",
  routePath: "/captcha/email/send",
  validateInput(ctx) {
    return checkValueAsync(ctx.req.json(), inputSchema);
  },
  async handler({ captchaReply, email, actionType }: SendEmailCaptchaParam, ctx): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaService.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();
    switch (actionType) {
      case EmailCaptchaActionType.resetPassword: {
        //需要目标邮箱对应的账户存在
        const userId = await checkEmailExists(email);
        if (!userId) throw new HttpError(406, "账号不存在");
        return sendResetPassportCaptcha(email);
      }

      case EmailCaptchaActionType.changeEmail: {
        //目标邮箱不存在 (要变更的邮箱不能被注册)
        //当前用户有效

        const account = await checkEmailExists(email);
        if (account !== undefined) throw new HttpError(406, "邮箱已被注册");
        return sendChangeEmailCaptcha(email);
      }
      case EmailCaptchaActionType.signup: {
        // 目标邮箱不存在 (要注册的邮箱不能被注册)
        // 不存在当前用户

        const account = await checkEmailExists(email);
        if (account !== undefined) throw new HttpError(406, "邮箱已被注册");
        return sendSignUpEmailCaptcha(email);
      }
      case EmailCaptchaActionType.login: {
        const account = await checkEmailExists(email);
        if (account === undefined) throw new HttpError(400, "账号不存在");
        const expire = 5 * 60; // 5 分钟有效期
        return sendEmailCaptcha(email, EmailCaptchaActionType.login, expire);
      }
      default:
        throw new HttpError(400, "不支持的操作类型");
    }
  },
});

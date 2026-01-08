import { CreateUserProfileParam, CreateUserProfileResult, EmailCaptchaActionType } from "@/dto.ts";
import { optional, array } from "@asla/wokao";
import { hashPasswordFrontEnd } from "../-services/password.ts";
import { checkValue, emailChecker } from "@/global/check.ts";
import { emailCaptchaService, emailCaptchaReplyChecker } from "@/routers/captcha/mod.ts";
import { appConfig } from "@/config.ts";
import { HttpCaptchaError, HttpError, HttpParamsCheckError } from "@/global/errors.ts";
import { createUser } from "../-sql/signup.ts";

import routeGroup, { signToken } from "../_route.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/signup",
  async validateInput(ctx) {
    if (!appConfig.passport?.signupEnabled) throw new HttpError(403, "禁止注册");
    const body = await ctx.req.json();
    const param = checkValue(body, {
      email: emailChecker,
      password: optional.string,
      passwordNoHash: optional.boolean,
      classId: optional(array.number),
      emailCaptcha: optional(emailCaptchaReplyChecker()),
    });

    return param;
  },
  async handler(body: CreateUserProfileParam): Promise<CreateUserProfileResult> {
    const verifyEmail = !appConfig.passport?.emailVerifyDisabled;
    if (verifyEmail) {
      const pass = body.emailCaptcha
        ? await emailCaptchaService.verify(body.emailCaptcha, body.email, EmailCaptchaActionType.signup)
        : false;
      if (!pass) throw new HttpCaptchaError();
    }
    if (body.password) {
      if (body.passwordNoHash) body.password = await hashPasswordFrontEnd(body.password);
      else if (!/[0-9a-f]{128}/.test(body.password!)) {
        throw new HttpParamsCheckError("密码哈希错误");
      }
    }

    const userId = await createUser(body.email, { password: body.password });
    const { token } = await signToken(userId);
    return { userId, jwtKey: token };
  },
});

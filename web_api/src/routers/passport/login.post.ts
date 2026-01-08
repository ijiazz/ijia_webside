import routeGroup, { signToken } from "./_route.ts";
import { LoginType, UserLoginResultDto } from "@/dto.ts";
import { optional, integer } from "@asla/wokao";
import { hashPasswordFrontEnd } from "./-services/password.ts";
import { setCookie } from "hono/cookie";
import { checkValue, emailChecker } from "@/global/check.ts";
import { imageCaptchaReplyChecker, imageCaptchaService } from "../captcha/mod.ts";
import { HttpCaptchaError, HttpError } from "@/global/errors.ts";
import { accountLoginByEmail, accountLoginById, updateLastLoginTime } from "./-sql/login.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/login",
  validateInput(ctx) {
    return ctx.req.json();
  },
  async handler(body: any, ctx) {
    {
      let pass: boolean;
      if (body.captcha) {
        const captcha = checkValue(body.captcha, imageCaptchaReplyChecker());
        pass = await imageCaptchaService.verify(captcha);
      } else pass = false;
      if (!pass) throw new HttpCaptchaError();
    }

    const method = body.method;
    let account: {
      userId: number;
      message?: string;
    };
    switch (method) {
      case LoginType.id: {
        const params = checkValue(body, {
          id: integer({ acceptString: true }),
          password: optional.string,
          passwordNoHash: optional.boolean,
        });
        if (params.passwordNoHash && params.password) params.password = await hashPasswordFrontEnd(params.password);
        const uid = await accountLoginById(+params.id, params.password);
        account = { userId: uid };
        break;
      }
      case LoginType.email: {
        const params = checkValue(body, {
          method: "string",
          email: emailChecker,
          password: optional.string,
          passwordNoHash: optional.boolean,
        });
        if (params.passwordNoHash && params.password) params.password = await hashPasswordFrontEnd(params.password);
        const uid = await accountLoginByEmail(params.email, params.password);
        account = { userId: uid };
        break;
      }
      default:
        throw new HttpError(400, { message: "方法不允许" });
    }

    const jwtKey = await signToken(account.userId);
    await updateLastLoginTime(account.userId);
    const value: UserLoginResultDto = {
      success: true,
      message: "登录成功",
      token: jwtKey.token,
      maxAge: jwtKey.maxAge,
    };
    if (value.success) setCookie(ctx, "access_token", value.token, { maxAge: value.maxAge });
    return ctx.json(value, 200);
  },
});

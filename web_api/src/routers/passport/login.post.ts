import routeGroup, { signToken } from "./_route.ts";
import {
  LoginMethod,
  UserLoginResult,
  UserLoginByPasswordParam,
  UserLoginByEmailCaptchaParam,
  EmailCaptchaActionType,
} from "@/dto.ts";
import { hashPasswordFrontEnd } from "./-services/password.ts";
import { emailCaptchaService, imageCaptchaService } from "../captcha/mod.ts";
import { HttpCaptchaError, HttpError } from "@/global/errors.ts";
import {
  accountLoginByEmail,
  accountLoginByEmailCaptcha,
  accountLoginById,
  updateLastLoginTime,
} from "./-sql/login.ts";
import { ENV, RunMode } from "@/config.ts";
import { checkUserParam } from "./-check/login.ts";
import { setCookieAuth } from "./-services/cookie.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/login",
  async validateInput({ req }) {
    const isTest = !!req.header("X-In-Test");
    return { unsafeParam: await req.json(), isTest };
  },
  async handler(body: { unsafeParam: any; isTest: boolean }, ctx): Promise<UserLoginResult> {
    const { isTest, unsafeParam } = body;
    let account: {
      userId: number;
      message?: string;
    };
    switch (unsafeParam.method) {
      case LoginMethod.password: {
        const param = checkUserParam(unsafeParam);
        const skipCaptcha = ENV.MODE === RunMode.Test && isTest;
        if (!skipCaptcha) {
          const pass = param.captcha ? await imageCaptchaService.verify(param.captcha) : false;
          if (!pass) throw new HttpCaptchaError();
        }
        const uid = await loginByPassword(param.user, param);
        account = { userId: uid };
        break;
      }
      case LoginMethod.emailCaptcha: {
        const uid = await loginByEmail(unsafeParam);
        account = { userId: uid };
        break;
      }
      default:
        throw new HttpError(400, { message: "方法不允许" });
    }

    const jwtKey = await signToken(account.userId);
    await updateLastLoginTime(account.userId);
    const keepLoggedIn = !!unsafeParam.keepLoggedIn;

    const value: UserLoginResult = {
      success: true,
      message: "登录成功",
      token: jwtKey.token,
      maxAge: keepLoggedIn ? jwtKey.maxAge : null,
      user: {
        id: account.userId.toString(),
      },
    };
    if (value.success) {
      setCookieAuth(ctx, value.token, value.maxAge);
    }
    return value;
  },
});
async function loginByPassword(
  user: number | string,
  param: Pick<UserLoginByPasswordParam, "password" | "passwordNoHash">,
): Promise<number> {
  if (param.passwordNoHash && param.password) param.password = await hashPasswordFrontEnd(param.password);

  let uid: number;
  switch (typeof user) {
    case "number":
      uid = await accountLoginById(user, param.password);
      break;
    case "string":
      uid = await accountLoginByEmail(user, param.password);
      break;
    default:
      throw new HttpError(400, "用户标识不合法");
  }
  return uid;
}
async function loginByEmail(param: UserLoginByEmailCaptchaParam): Promise<number> {
  const pass = await emailCaptchaService.verify(param.emailCaptcha, param.email, EmailCaptchaActionType.login);
  if (!pass) throw new HttpError(401, { message: "邮箱验证码错误" });
  return accountLoginByEmailCaptcha(param.email);
}

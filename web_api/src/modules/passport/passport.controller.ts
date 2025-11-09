import {
  LoginType,
  RequestSendEmailCaptchaParam,
  ResetPasswordParam,
  UserLoginResultDto,
  type CreateUserProfileParam,
  type CreateUserProfileResult,
} from "./passport.dto.ts";
import { optional, array, integer } from "@asla/wokao";
import { hashPasswordFrontEnd } from "./services/password.ts";
import { setCookie } from "hono/cookie";
import { Controller, Get, PipeInput, PipeOutput, Post, ToArguments } from "@asla/hono-decorator";
import { checkValue, checkValueAsync, emailChecker } from "@/global/check.ts";
import {
  imageCaptchaReplyChecker,
  imageCaptchaController,
  emailCaptchaService,
  emailCaptchaReplyChecker,
  EmailCaptchaQuestion,
  EmailCaptchaType,
} from "../captcha/mod.ts";
import { autoBody } from "@/global/pipe.ts";
import { Context } from "hono";
import { appConfig } from "@/config.ts";
import { HttpCaptchaError, HttpError, HttpParamsCheckError } from "@/global/errors.ts";
import { PassportConfig } from "./passport.dto.ts";
import { sendResetPassportCaptcha, sendSignUpEmailCaptcha } from "./services/send_email_captcha.ts";
import { signAccessToken } from "@/global/jwt.ts";
import { user } from "@ijia/data/db";
import v from "@ijia/data/dbclient";
import { accountLoginByEmail, accountLoginById, updateLastLoginTime } from "./sql/login.ts";
import { createUser } from "./sql/signup.ts";
import { resetAccountPassword } from "./sql/account.ts";

@autoBody
@Controller({})
export class PassportController {
  constructor() {}

  @Get("/passport/config")
  async getPassportConfig(): Promise<PassportConfig> {
    const p = appConfig.passport;
    if (!p) return {};
    return {
      signupEnabled: p.signupEnabled,
      loginCaptchaDisabled: p.loginCaptchaDisabled,
      signupTip: p.signupTip,
      loginTip: p.loginTip,
    };
  }

  @ToArguments(async function (ctx) {
    if (!appConfig.passport?.signupEnabled) throw new HttpError(403, "禁止注册");
    const body = await ctx.req.json();
    const param = checkValue(body, {
      email: emailChecker,
      password: optional.string,
      passwordNoHash: optional.boolean,
      classId: optional(array.number),
      emailCaptcha: optional(emailCaptchaReplyChecker()),
    });

    return [param];
  })
  @Post("/passport/signup")
  async createUser(body: CreateUserProfileParam): Promise<CreateUserProfileResult> {
    const verifyEmail = !appConfig.passport?.emailVerifyDisabled;
    if (verifyEmail) {
      const pass = body.emailCaptcha
        ? await emailCaptchaService.verify(body.emailCaptcha, body.email, EmailCaptchaType.signup)
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
    const { token } = await this.signToken(userId);
    return { userId, jwtKey: token };
  }

  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    return checkValue(body, {
      captchaReply: imageCaptchaReplyChecker(),
      email: emailChecker,
    });
  })
  @Post("/passport/signup/email_captcha")
  async signupSendEmailCaptcha({ captchaReply, email }: RequestSendEmailCaptchaParam): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaController.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();
    return sendSignUpEmailCaptcha(email);
  }

  @PipeOutput(function (value, ctx) {
    if (value.success) setCookie(ctx, "access_token", value.token, { maxAge: value.maxAge });
    return ctx.json(value, 200);
  })
  @PipeInput(function (ctx: Context) {
    return ctx.req.json();
  })
  @Post("/passport/login")
  async login(body: any): Promise<UserLoginResultDto> {
    {
      let pass: boolean;
      if (body.captcha) {
        const captcha = checkValue(body.captcha, imageCaptchaReplyChecker());
        pass = await imageCaptchaController.verify(captcha);
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

    const jwtKey = await this.signToken(account.userId);
    await updateLastLoginTime(account.userId);
    return {
      success: true,
      message: "登录成功",
      token: jwtKey.token,
      maxAge: jwtKey.maxAge,
    };
  }
  private async signToken(userId: number) {
    const DAY = 24 * 60 * 60; // 一天的秒数
    const jwtKey = await signAccessToken(userId, {
      survivalSeconds: 60 * 60, // 60 分钟过期. 每60分钟需要刷新一次
      refreshKeepAliveSeconds: 7 * DAY, // 7 天内有操作可免登录
      refreshSurvivalSeconds: 30 * DAY, // 刷新 token 最多可以用 1 个月
    });

    return jwtKey;
  }

  @ToArguments(async function (ctx) {
    const param = await checkValueAsync(ctx.req.json(), {
      email: "string",
      emailCaptcha: emailCaptchaReplyChecker(),

      newPassword: "string",
      passwordNoHash: optional.boolean,
    });
    if (param.passwordNoHash) param.newPassword = await hashPasswordFrontEnd(param.newPassword);

    return [param];
  })
  @Post("/passport/reset_password")
  async resetPassword(body: ResetPasswordParam): Promise<void> {
    const pass = await emailCaptchaService.verify(body.emailCaptcha, body.email, EmailCaptchaType.resetPassword);
    if (!pass) throw new HttpError(409, "验证码错误");
    await resetAccountPassword(body.email, body.newPassword);
  }

  @PipeInput(function (ctx) {
    return checkValueAsync(ctx.req.json(), {
      captchaReply: imageCaptchaReplyChecker(),
      email: emailChecker,
    });
  })
  @Post("/passport/reset_password/email_captcha")
  async resetPasswordSendCaptcha({ captchaReply, email }: RequestSendEmailCaptchaParam): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaController.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();

    const [account] = await user
      .select<{ email: string; id: number }>({ email: true, id: true })
      .where(`email=${v(email)}`)
      .limit(1)
      .queryRows();
    if (!account) throw new HttpError(406, "账号不存在");

    return sendResetPassportCaptcha(email, account.id);
  }
}

export const passportController = new PassportController();

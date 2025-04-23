import {
  ChangeEmailParam,
  LoginType,
  RequestSendEmailCaptchaParam,
  ResetPasswordParam,
  UserLoginResultDto,
  type CreateUserProfileParam,
  type CreateUserProfileResult,
} from "./passport.dto.ts";
import { optional, array, stringMatch, integer } from "@asla/wokao";
import { passportService } from "./services/passport.service.ts";
import { hashPasswordFrontEnd } from "./services/password.ts";
import { setCookie } from "hono/cookie";
import { Controller, Get, PipeInput, PipeOutput, Post, ToArguments, Use } from "@asla/hono-decorator";
import { checkValue, checkValueAsync } from "@/global/check.ts";
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
import { rolesGuard } from "@/global/auth.ts";
import { HonoContext } from "@/hono/type.ts";
import { PassportConfig } from "./passport.dto.ts";
import {
  sendChangeEmailCaptcha,
  sendResetPassportCaptcha,
  sendSignUpEmailCaptcha,
} from "./services/send_email_captcha.ts";
import { signLoginJwt } from "@/global/jwt.ts";
const emailCheck = stringMatch(/^[^@]+@.+?\..+$/);

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
      email: emailCheck,
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

    const userId = await passportService.createUser(body.email, { password: body.password });
    const { token } = await this.signToken(userId);
    return { userId, jwtKey: token };
  }

  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    return checkValue(body, {
      captchaReply: imageCaptchaReplyChecker(),
      email: emailCheck,
    });
  })
  @Post("/passport/signup/email_captcha")
  async signupSendEmailCaptcha({ captchaReply, email }: RequestSendEmailCaptchaParam): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaController.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();
    return sendSignUpEmailCaptcha(email);
  }

  @PipeOutput(function (value, ctx) {
    if (value.success) setCookie(ctx, "jwt-token", value.token);
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
    let user: {
      userId: number;
      message?: string;
    };
    switch (method) {
      case LoginType.id: {
        const params = checkValue(body, {
          id: integer({ acceptString: true }),
          password: "string",
          passwordNoHash: optional.boolean,
        });
        if (params.passwordNoHash) params.password = await hashPasswordFrontEnd(params.password);
        const uid = await passportService.loginById(+params.id, params.password);
        user = { userId: uid };
        break;
      }
      case LoginType.email: {
        const params = checkValue(body, {
          method: "string",
          email: "string",
          password: "string",
          passwordNoHash: optional.boolean,
        });
        if (params.passwordNoHash) params.password = await hashPasswordFrontEnd(params.password);
        const uid = await passportService.loginByEmail(params.email, params.password);
        user = { userId: uid };
        break;
      }
      default:
        throw new HttpError(400, { message: "方法不允许" });
    }

    const jwtKey = await this.signToken(user.userId);

    return {
      success: true,
      message: "登录成功",
      token: jwtKey.token,
    };
  }
  private async signToken(userId: number) {
    const minute = 3 * 24 * 60; // 3 天后过期
    const jwtKey = await signLoginJwt(userId, minute);

    return {
      token: jwtKey,
    };
  }

  @Use(rolesGuard)
  @ToArguments(async function (ctx: HonoContext) {
    const userInfo = ctx.get("userInfo");
    const userId = await userInfo.getJwtInfo().then((res) => +res.userId);

    const param = await checkValueAsync(ctx.req.json(), {
      newPassword: "string",
      oldPassword: "string",
      passwordNoHash: optional.boolean,
    });

    if (param.passwordNoHash) {
      const res = await Promise.all([
        hashPasswordFrontEnd(param.newPassword),
        hashPasswordFrontEnd(param.oldPassword!),
      ]);
      param.newPassword = res[0];
      param.newPassword = res[1];
    }
    return [userId, param.newPassword, param.oldPassword];
  })
  @Post("/passport/change_password")
  async changePassword(userId: number, newPwd: string, oldPwd: string): Promise<void> {
    await passportService.changePasswordVerifyOld(+userId, oldPwd, newPwd);
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
    await passportService.resetPassword(body.email, body.newPassword);
  }

  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    return checkValue(body, {
      captchaReply: imageCaptchaReplyChecker(),
      email: emailCheck,
    });
  })
  @Post("/passport/reset_password/email_captcha")
  async resetPasswordSendCaptcha({ captchaReply, email }: RequestSendEmailCaptchaParam): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaController.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();
    return sendResetPassportCaptcha(email);
  }

  @Use(rolesGuard)
  @ToArguments(async function (ctx: HonoContext) {
    const userId = await ctx
      .get("userInfo")
      .getUserInfo()
      .then((item) => +item.user_id);
    const param = await checkValueAsync(ctx.req.json(), {
      email: "string",
      emailCaptcha: emailCaptchaReplyChecker(),
    });

    return [userId, param];
  })
  @Post("/passport/change_email")
  async changeEmail(userId: number, body: ChangeEmailParam): Promise<void> {
    await emailCaptchaService.verify(body.emailCaptcha, body.email, EmailCaptchaType.changeEmail);
    await passportService.changeEmail(userId, body.email);
  }

  @Use(rolesGuard)
  @ToArguments(async function (ctx: HonoContext) {
    const userId = await ctx
      .get("userInfo")
      .getUserInfo()
      .then((item) => +item.user_id);
    const body = await ctx.req.json();
    return [
      userId,
      checkValue(body, {
        captchaReply: imageCaptchaReplyChecker(),
        email: emailCheck,
      }),
    ];
  })
  @Post("/passport/change_email/email_captcha")
  async changeEmailSendCaptcha(
    userId: number,
    { captchaReply, email }: RequestSendEmailCaptchaParam,
  ): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaController.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();
    return sendChangeEmailCaptcha(email, userId);
  }
}

export const passportController = new PassportController();

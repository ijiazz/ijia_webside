import { user } from "@ijia/data/db";
import v from "@ijia/data/yoursql";
import {
  LoginType,
  RequestSignupEmailCaptchaParam,
  UserLoginResultDto,
  UserProfileDto,
  type CreateUserProfileParam,
  type CreateUserProfileResult,
} from "./user.type.ts";
import { optional, array } from "evlib/validator";
import { loginService } from "./services/Login.service.ts";
import { hashPasswordFrontEnd } from "./services/password.ts";
import { setCookie } from "hono/cookie";
import { Controller, Get, PipeInput, PipeOutput, Post } from "@asla/hono-decorator";
import { HonoContext } from "@/hono/type.ts";
import { checkValue } from "@/global/check.ts";
import { integer } from "evlib/validator";
import {
  imageCaptchaReplyChecker,
  imageCaptchaController,
  emailCaptchaService,
  emailCaptchaReplyChecker,
  CaptchaEmail,
  EmailCaptchaQuestion,
} from "../captcha/mod.ts";
import { autoBody } from "@/global/pipe.ts";
import { createEmailCodeHtmlContent } from "./template/sigup-email-code.ts";
import { Context } from "hono";
import { ENV, Mode } from "@/global/config.ts";
import { APP_CONFIG } from "@/config.ts";
import { createMessageResponseError } from "@/global/http_error.ts";

@autoBody
@Controller({})
export class UserController {
  constructor() {}

  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    const param = checkValue(body, {
      email: "string",
      password: optional.string,
      classId: optional(array.number),
      emailCaptcha: emailCaptchaReplyChecker(),
    });

    return param;
  })
  @Post("/user/signup")
  async createUser(body: CreateUserProfileParam): Promise<CreateUserProfileResult> {
    if (ENV.SIGNUP_VERIFY_EMAIL) {
      const pass = await emailCaptchaService.verify(body.emailCaptcha!);
      if (!pass) throw createMessageResponseError(403, "验证码错误");
    }

    const userId = await loginService.createUser(body.email, { classId: body.classId, password: body.password });

    return { userId };
  }

  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    return checkValue(body, { captchaReply: imageCaptchaReplyChecker(), email: "string" });
  })
  @Post("/user/signup/email_captcha")
  async sendEmailCaptcha({ captchaReply, email }: RequestSignupEmailCaptchaParam): Promise<EmailCaptchaQuestion> {
    {
      const pass = await imageCaptchaController.verify(captchaReply);
      if (!pass) throw createMessageResponseError(403, "验证码错误");

      const exists = await user
        .select({ email: true })
        .where(`email=${v(email)}`)
        .limit(1)
        .queryCount();
      if (exists) throw createMessageResponseError(406, "邮件已被注册");
    }

    const code = emailCaptchaService.genCode();
    const expire = 5 * 60; // 5 分钟有效期
    const htmlContent = createEmailCodeHtmlContent({
      code,
      time: expire,
      title: `HI! 您正在使用 ${email} 注册 ${APP_CONFIG.appName}账号`,
    });
    const captchaEmail: CaptchaEmail = {
      expire,
      code,
      recipient: email,
      title: `${APP_CONFIG.appName}验证码: ${code}`,
      text: htmlContent,
    };
    let emailCaptchaQuestion: EmailCaptchaQuestion;
    if (ENV.MODE == Mode.Prod) {
      emailCaptchaQuestion = await emailCaptchaService.sendEmailCaptcha(captchaEmail);
    } else {
      emailCaptchaQuestion = await emailCaptchaService.createSession(captchaEmail);
    }
    return emailCaptchaQuestion;
  }

  @PipeOutput(function (value, ctx) {
    if (value.success) setCookie(ctx, "jwt-token", value.token);
    return ctx.json(value, 200);
  })
  @PipeInput(function (ctx: Context) {
    return ctx.req.json();
  })
  @Post("/user/login")
  async login(body: any): Promise<UserLoginResultDto> {
    {
      let pass: boolean;
      if (body.captcha) {
        const captcha = checkValue(body.captcha, imageCaptchaReplyChecker());
        pass = await imageCaptchaController.verify(captcha);
      } else pass = false;
      if (!pass) throw createMessageResponseError(403, "验证码错误");
    }

    const method = body.method;
    let user: {
      userId?: number;
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
        user = await loginService.loginById(+params.id, params.password);
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
        user = await loginService.loginByEmail(params.email, params.password);
        break;
      }
      default:
        throw createMessageResponseError(400, "方法不允许");
    }
    if (user.userId === undefined) {
      throw createMessageResponseError(403, user.message!);
    }

    const minute = 3 * 24 * 60; // 3 天后过期
    const jwtKey = await loginService.signJwt(user.userId, minute);

    return {
      success: true,
      message: "登录成功",
      token: jwtKey,
    };
  }

  // @Patch("/user/self/profile")
  // updateUser(@Body() body: unknown) {}
  @PipeInput(async function (ctx) {
    return [await ctx.req.json()];
  })
  @Post("/user/self/bind_platform")
  async bindPlatform(body: unknown) {}

  @PipeInput(async function (ctx: HonoContext) {
    const userInfo = await ctx.get("userInfo");
    const jwtInfo = await userInfo.getJwtInfo();
    return +jwtInfo.userId;
  })
  @Get("/user/self/profile")
  async getUser(userId: number): Promise<UserProfileDto> {
    const users = await user
      .select<UserProfileDto>({ userId: "id", avatarUrl: "avatar", nickname: true })
      .where(`id=${v(userId)}`)
      .queryRows();
    return users[0];
  }
}

export const userController = new UserController();

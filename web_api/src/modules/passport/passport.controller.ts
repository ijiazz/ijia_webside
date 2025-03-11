import { user } from "@ijia/data/db";
import v from "@ijia/data/yoursql";
import {
  LoginType,
  RequestSignupEmailCaptchaParam,
  UserLoginResultDto,
  type CreateUserProfileParam,
  type CreateUserProfileResult,
} from "./passport.dto.ts";
import { optional, array } from "evlib/validator";
import { loginService } from "./services/passport.service.ts";
import { hashPasswordFrontEnd } from "./services/password.ts";
import { setCookie } from "hono/cookie";
import { Controller, PipeInput, PipeOutput, Post, ToArguments, ToResponse, Use } from "@asla/hono-decorator";
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
import { HttpCaptchaError, HttpError, HttpParamsCheckError } from "@/global/errors.ts";
import { rolesGuard } from "@/global/auth.ts";
import { HonoContext } from "@/hono/type.ts";

@autoBody
@Controller({})
export class PassportController {
  constructor() {}

  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    const param = checkValue(body, {
      email: "string",
      password: optional.string,
      passwordNoHash: optional.boolean,
      classId: optional(array.number),
      emailCaptcha: emailCaptchaReplyChecker(),
    });

    return param;
  })
  @Post("/passport/signup")
  async createUser(body: CreateUserProfileParam): Promise<CreateUserProfileResult> {
    if (ENV.SIGNUP_VERIFY_EMAIL) {
      const pass = await emailCaptchaService.verify(body.emailCaptcha!, body.email);
      if (!pass) throw new HttpCaptchaError();
    }
    if (body.password) {
      if (body.passwordNoHash) body.password = await hashPasswordFrontEnd(body.password);
      else if (!/[0-9a-f]{128}/.test(body.password!)) {
        throw new HttpParamsCheckError("密码哈希错误");
      }
    }

    const userId = await loginService.createUser(body.email, { password: body.password });

    return { userId };
  }

  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    return checkValue(body, { captchaReply: imageCaptchaReplyChecker(), email: "string" });
  })
  @Post("/passport/signup/email_captcha")
  async sendEmailCaptcha({ captchaReply, email }: RequestSignupEmailCaptchaParam): Promise<EmailCaptchaQuestion> {
    {
      const pass = await imageCaptchaController.verify(captchaReply);
      if (!pass) throw new HttpCaptchaError();

      const exists = await user
        .select({ email: true })
        .where(`email=${v(email)}`)
        .limit(1)
        .queryCount();
      if (exists) throw new HttpError(406, { message: "邮件已被注册" });
    }

    const isProd = ENV.MODE === Mode.Prod;
    const code = isProd ? "1234" : emailCaptchaService.genCode();
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
    if (isProd) {
      emailCaptchaQuestion = await emailCaptchaService.sendEmailCaptcha(captchaEmail);
    } else {
      if (ENV.MODE === Mode.Dev) console.log("模拟发送邮件验证码：" + code, captchaEmail);
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
        const uid = await loginService.loginById(+params.id, params.password);
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
        const uid = await loginService.loginByEmail(params.email, params.password);
        user = { userId: uid };
        break;
      }
      default:
        throw new HttpError(400, { message: "方法不允许" });
    }

    const minute = 3 * 24 * 60; // 3 天后过期
    const jwtKey = await loginService.signJwt(user.userId, minute);

    return {
      success: true,
      message: "登录成功",
      token: jwtKey,
    };
  }

  @Use(rolesGuard)
  @ToArguments(async function (ctx: HonoContext) {
    const body = await ctx.req.json();
    const param = checkValue(body, { newPassword: "string", oldPassword: "string", userId: optional.string });
    const userInfo = ctx.get("userInfo");
    const userId: string = await userInfo.getJwtInfo().then((res) => res.userId);
    return [userId, param.oldPassword, param.newPassword];
  })
  @Post("/passport/change_password")
  async changePassword(userId: string, oldPwd: string, newPwd: string) {
    await loginService.changePassword(+userId, oldPwd, newPwd);
  }
}

export const passportController = new PassportController();

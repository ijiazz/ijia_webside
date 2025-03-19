import { user } from "@ijia/data/db";
import v from "@ijia/data/yoursql";
import {
  LoginType,
  RequestSignupEmailCaptchaParam,
  UserLoginResultDto,
  type CreateUserProfileParam,
  type CreateUserProfileResult,
} from "./passport.dto.ts";
import { optional, array, stringMatch } from "evlib/validator";
import { passportService } from "./services/passport.service.ts";
import { hashPasswordFrontEnd } from "./services/password.ts";
import { setCookie } from "hono/cookie";
import { Controller, PipeInput, PipeOutput, Post, ToArguments, Use } from "@asla/hono-decorator";
import { checkValue, checkValueAsync } from "@/global/check.ts";
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
import { ENV, RunMode } from "@/global/config.ts";
import { APP_CONFIG } from "@/config.ts";
import { HttpCaptchaError, HttpError, HttpParamsCheckError } from "@/global/errors.ts";
import { rolesGuard } from "@/global/auth.ts";
import { HonoContext } from "@/hono/type.ts";
const emailCheck = stringMatch(/^[^@]+@.+?\..+$/);
@autoBody
@Controller({})
export class PassportController {
  constructor() {}

  @ToArguments(async function (ctx) {
    const body = await ctx.req.json();
    const param = checkValue(body, {
      email: emailCheck,
      password: optional.string,
      passwordNoHash: optional.boolean,
      classId: optional(array.number),
      emailCaptcha: optional(emailCaptchaReplyChecker()),
    });

    return [param, !ENV.SIGUP_VERIFY_EMAIL_DISABLE];
  })
  @Post("/passport/signup")
  async createUser(body: CreateUserProfileParam, verifyEmail?: boolean): Promise<CreateUserProfileResult> {
    if (verifyEmail) {
      const pass = body.emailCaptcha ? await emailCaptchaService.verify(body.emailCaptcha, body.email) : false;
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

    const code = ENV.IS_TEST ? "1234" : emailCaptchaService.genCode();
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
    if (ENV.IS_PROD) {
      emailCaptchaQuestion = await emailCaptchaService.sendEmailCaptcha(captchaEmail);
    } else {
      if (ENV.MODE === RunMode.Dev) console.log("模拟发送邮件验证码：" + code, captchaEmail);
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
    const jwtKey = await passportService.signJwt(userId, minute);

    return {
      token: jwtKey,
    };
  }

  @Use(rolesGuard)
  @ToArguments(async function (ctx: HonoContext) {
    const userInfo = ctx.get("userInfo");
    const userId: string = await userInfo.getJwtInfo().then((res) => res.userId);
    const param = await checkValueAsync(ctx.req.json(), {
      newPassword: "string",
      oldPassword: "string",
      passwordNoHash: optional.boolean,
    });
    return [userId, param.oldPassword, param.newPassword];
  })
  @Post("/passport/change_password")
  async changePassword(userId: string, oldPwd: string, newPwd: string, passwordNoHash?: boolean): Promise<void> {
    if (passwordNoHash) {
      const res = await Promise.all([hashPasswordFrontEnd(newPwd), hashPasswordFrontEnd(oldPwd)]);
      newPwd = res[0];
      oldPwd = res[1];
    }
    await passportService.changePassword(+userId, oldPwd, newPwd);
  }
}

export const passportController = new PassportController();

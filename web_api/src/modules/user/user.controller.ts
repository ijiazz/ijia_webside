import { dclass, pla_user, user, user_class_bind } from "@ijia/data/db";
import v, { getDbPool } from "@ijia/data/yoursql";
import {
  LoginType,
  UserLoginResultDto,
  UserProfileDto,
  type CreateUserProfileParam,
  type CreateUserProfileResult,
  type UserLoginParamDto,
} from "./user.type.ts";
import { optional, array } from "evlib/validator";
import { loginService } from "./services/Login.service.ts";
import { hashPasswordBackEnd, hashPasswordFrontEnd } from "./services/password.ts";
import { setCookie } from "hono/cookie";
import { Controller, Get, PipeInput, PipeOutput, Post } from "@asla/hono-decorator";
import { HonoContext } from "@/hono/type.ts";
import { checkValue } from "@/global/check.ts";
import { integer, stringMatch } from "evlib/validator";
import { HTTPException } from "hono/http-exception";
import {
  imageCaptchaReplyChecker,
  imageCaptchaController,
  emailCaptchaService,
  emailCaptchaReplyChecker,
} from "../captcha/mod.ts";
import { autoBody } from "@/global/pipe.ts";
import { createEmailCodeHtmlContent } from "./template/sigup-email-code.ts";
import { Context } from "hono";
import { ENV } from "@/config/mod.ts";

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

    const pass = await emailCaptchaService.verify(param.emailCaptcha);
    if (!pass) throw new HTTPException(403);
    return param;
  })
  @Post("/user/signup")
  async createUser(body: Omit<CreateUserProfileParam, "emailVerification">): Promise<CreateUserProfileResult> {
    let password: string | undefined;
    let salt: string | undefined;
    if (typeof body.password === "string") {
      salt = crypto.randomUUID().replaceAll("-", "");
      password = await hashPasswordBackEnd(body.password, salt);
    }
    await using db = getDbPool().begin();
    const createUserSql = user
      .insert({ email: body.email, password: password, pwd_salt: salt })
      .returning<{ userId: number }>({ userId: "id" });
    const userId = await db.queryRows(createUserSql).then((item) => item[0].userId);
    if (body.classId?.length) {
      // 目前只能选择一个班级
      const classId = body.classId[0];
      const exists = await dclass.select({ id: true }).where(`id=${classId} AND is_public= TRUE`).queryCount();
      if (!exists) throw new HTTPException(400, { cause: "班级不存在" });
      const insertRoles = user_class_bind.insert(
        body.classId.map((classId) => ({ class_id: classId, user_id: userId })),
      );
      await db.queryCount(insertRoles);
    }
    await db.commit();

    return { userId };
  }

  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    const param = checkValue(body, { captchaReply: imageCaptchaReplyChecker(), email: "string" });
    const pass = await imageCaptchaController.verify(param.captchaReply);
    if (!pass) throw new HTTPException(403, { cause: "验证码错误" });

    return param.email;
  })
  @Post("/user/signup/email_captcha")
  async sendEmailCaptcha(email: string) {
    const exists = await pla_user
      .select({ email: true })
      .where(`email=${v(email)}`)
      .limit(1)
      .queryCount();
    if (exists) return;

    const code = emailCaptchaService.genCode();
    const expire = 5 * 60; // 5 分钟有效期
    const htmlContent = createEmailCodeHtmlContent({
      code,
      time: expire,
      title: `HI! 您正在使用 ${email} 注册 IJIA 学院账号`,
    });
    const sessionId = emailCaptchaService.sendEmailCaptcha({
      expire,
      code,
      email: email,
      title: `IJIA 学院验证码: ${code}`,
      text: htmlContent,
    });
    return {
      sessionId,
    };
  }

  @PipeOutput(function (value, ctx) {
    if (value.success) setCookie(ctx, "jwt-token", value.token);
    return ctx.json(value, 200);
  })
  @PipeInput(async function (ctx: Context) {
    const body: UserLoginParamDto = await ctx.req.json();
    if (ENV.SIGUP_VERIFY_EMAIL) {
      let pass: boolean;
      if (body.captcha) {
        const captcha = checkValue(body.captcha, imageCaptchaReplyChecker());
        pass = await imageCaptchaController.verify(captcha);
      } else pass = false;
      if (!pass) throw new HTTPException(200, { message: "验证码错误", res: ctx.json({ message: "验证码错误" }) });
    }
    return body;
  })
  @Post("/user/login")
  async login(body: any): Promise<UserLoginResultDto> {
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
        throw new HTTPException(400, { res: Response.json({ message: "方法不允许" }) });
    }
    if (user.userId === undefined) {
      return { message: user.message, success: false, token: "" };
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

import { dclass, user, user_class_bind } from "@ijia/data/db";
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
import { HTTPException } from "hono/http-exception";
import {
  ImageCaptchaReply,
  imageCaptchaReplyChecker,
  imageCaptchaController,
  emailCaptchaController,
  emailCaptchaReplyChecker,
} from "../captcha/mod.ts";
import { toJson } from "@/global/pipe.ts";

@Controller({})
export class UserController {
  constructor() {}
  @PipeOutput(toJson)
  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    const param = checkValue(body, {
      email: "string",
      password: optional.string,
      classId: optional(array.number),
      emailCaptcha: emailCaptchaReplyChecker(),
    });

    const pass = await emailCaptchaController.verify(param.emailCaptcha);
    if (!pass) throw new HTTPException(403);
    return param;
  })
  @Post("/user/profile")
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
  // @Patch("/user/self/profile")
  // updateUser(@Body() body: unknown) {}
  @PipeInput(async function (ctx) {
    return [await ctx.req.json()];
  })
  @Post("/user/self/bind_platform")
  async bindPlatform(body: unknown) {}

  @PipeOutput(toJson)
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

  @PipeOutput(function (value, ctx) {
    setCookie(ctx, "jwt-token", value.token);
    return ctx.json(value, 200);
  })
  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    const method = body.method;
    let params: UserLoginParamDto;
    switch (method) {
      case LoginType.id: {
        let res = checkValue(body, { id: "string", password: "string", passwordNoHash: optional.boolean });
        params = { ...res, method: LoginType.id };
        break;
      }
      case LoginType.email: {
        let res = checkValue(body, {
          method: "string",
          email: "string",
          password: "string",
          passwordNoHash: optional.boolean,
        });
        params = { ...res, method: LoginType.email };
        break;
      }
      default:
        throw new HTTPException(400, { cause: ctx.json({ success: false, message: "方法不允许" }, 400) });
    }
    return params;
  })
  @Post("/user/login")
  async login(params: UserLoginParamDto): Promise<UserLoginResultDto> {
    let user: {
      userId?: number;
      message?: string;
    };
    switch (params.method) {
      case LoginType.id: {
        if (params.passwordNoHash) params.password = await hashPasswordFrontEnd(params.password);
        user = await loginService.loginById(+params.id, params.password);
        break;
      }
      case LoginType.email: {
        if (params.passwordNoHash) params.password = await hashPasswordFrontEnd(params.password);
        user = await loginService.loginByEmail(params.email, params.password);
        break;
      }
      default:
        throw new HTTPException(400, { res: Response.json({ message: "方法不允许" }) });
    }
    if (user.userId === undefined) {
      throw new HTTPException(403, { res: Response.json({ message: user.message }) });
    }

    const minute = 3 * 24 * 60; // 3 天后过期
    const jwtKey = await loginService.signJwt(user.userId, minute);

    return {
      success: true,
      message: "登录成功",
      token: jwtKey,
    };
  }

  @PipeOutput(toJson)
  @Post("/user/email/verification")
  @PipeInput(async function (ctx) {
    const body = await ctx.req.json();
    return checkValue(body, { captchaReply: imageCaptchaReplyChecker(), email: "string" });
  })
  async sendEmailVerificationCode(body: { email: string; captchaReply: ImageCaptchaReply }) {
    const pass = await imageCaptchaController.verify(body.captchaReply);
    if (!pass) throw new HTTPException(403, { cause: "验证码错误" });
    //TODO: 创建用户时邮件验证码内容
    const sessionId = emailCaptchaController.emailCreateSession({
      email: body.email,
      content: ``,
      prefix: "createUser",
    });
    return {
      sessionId,
    };
  }
}

export const userController = new UserController();

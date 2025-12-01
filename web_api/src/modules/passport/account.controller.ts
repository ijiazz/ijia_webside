import { autoBody } from "@/global/pipe.ts";
import { Controller, Post, ToArguments, Use } from "@asla/hono-decorator";
import { RequestSendEmailCaptchaParam } from "@/dto/passport.ts";
import { HttpCaptchaError, HttpError } from "@/global/errors.ts";
import {
  emailCaptchaReplyChecker,
  emailCaptchaService,
  EmailCaptchaType,
  imageCaptchaController,
  imageCaptchaReplyChecker,
} from "../../routers/captcha/mod.ts";
import { checkValueAsync, emailChecker } from "@/global/check.ts";
import { identity, UserInfo } from "@/middleware/auth.ts";
import { HonoContext } from "@/hono/type.ts";
import { signSysJWT, parseSysJWT } from "@/global/jwt.ts";
import { sendAccountAuthEmailCaptcha, sendChangeEmailCaptcha } from "./services/send_email_captcha.ts";
import { AccountAuthenticateToken, ChangeEmailParam, GetAccountAuthTokenParam } from "@/dto/account.ts";
import { optional } from "@asla/wokao";
import { hashPasswordFrontEnd } from "./services/password.ts";
import { changeAccountEmail, changeAccountPassword } from "./sql/account.ts";
import { EmailCaptchaQuestion, EmailCaptchaReply, ImageCaptchaReply } from "@/dto/captcha.ts";

@Use(identity)
@autoBody
@Controller({})
export class AccountController {
  static async verifyAccountToken(
    token: string,
    userId: number,
    email: string,
  ): Promise<{ userId: number; email: string }> {
    const data = await parseSysJWT(token);
    if (!data.exp || data.exp < Date.now()) {
      throw new HttpError(401, "身份验证已过期");
    }
    if (data.userId !== userId || data.email !== email) {
      throw new HttpError(401, "身份验证错误");
    }
    return { email: data.email, userId: data.userId };
  }

  @ToArguments(async function (ctx: HonoContext) {
    const param = await checkValueAsync(ctx.req.json(), { emailCaptcha: emailCaptchaReplyChecker() });
    return [ctx.get("userInfo"), param];
  })
  @Post("/passport/sign_account_token")
  async signAccountAuthToken(userInfo: UserInfo, body: GetAccountAuthTokenParam): Promise<AccountAuthenticateToken> {
    const user = await userInfo.getValidUserSampleInfo();
    await this.verifyCaptcha(body.emailCaptcha, user.email);
    const exp = Date.now() + 10 * 60 * 1000; // 10分钟
    const token = await signSysJWT({ userId: user.user_id, email: user.email, exp });

    return {
      account_token: token,
    };
  }

  private async verifyCaptcha(captchaReply: EmailCaptchaReply, email: string): Promise<void> {
    const pass = await emailCaptchaService.verify(captchaReply, email, EmailCaptchaType.verifyAccountEmail);
    if (!pass) throw new HttpCaptchaError();
  }

  @ToArguments(async function (ctx) {
    const param = await checkValueAsync(ctx.req.json(), {
      captchaReply: imageCaptchaReplyChecker(),
    });
    return [ctx.get("userInfo"), param.captchaReply];
  })
  @Post("/passport/sign_account_token/email_captcha")
  async resetPasswordSendCaptcha(user: UserInfo, captchaReply: ImageCaptchaReply): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaController.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();
    const userInfo = await user.getValidUserSampleInfo();
    return sendAccountAuthEmailCaptcha(userInfo.email, userInfo.user_id);
  }

  @ToArguments(async function (ctx: HonoContext) {
    const userInfo = await ctx.get("userInfo").getValidUserSampleInfo();
    const param = await checkValueAsync(ctx.req.json(), {
      newEmail: emailChecker,
      accountToken: "string",
      emailCaptcha: emailCaptchaReplyChecker(),
    });
    await AccountController.verifyAccountToken(param.accountToken, userInfo.user_id, userInfo.email);

    return [userInfo.user_id, param];
  })
  @Post("/passport/change_email")
  async changeEmail(userId: number, body: ChangeEmailParam): Promise<void> {
    const pass = await emailCaptchaService.verify(body.emailCaptcha, body.newEmail, EmailCaptchaType.changeEmail);
    if (!pass) throw new HttpCaptchaError();
    await changeAccountEmail(userId, body.newEmail);
  }

  @ToArguments(async function (ctx: HonoContext) {
    const userId = await ctx.get("userInfo").getUserId();
    const body = await checkValueAsync(ctx.req.json(), {
      captchaReply: imageCaptchaReplyChecker(),
      email: emailChecker,
    });
    return [userId, body];
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
    await changeAccountPassword(+userId, oldPwd, newPwd);
  }
}

export default new AccountController();

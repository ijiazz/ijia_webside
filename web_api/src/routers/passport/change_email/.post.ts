import { HttpCaptchaError, HttpError } from "@/global/errors.ts";
import { emailCaptchaReplyChecker, emailCaptchaService, EmailCaptchaType } from "@/routers/captcha/mod.ts";
import { checkValueAsync, emailChecker } from "@/global/check.ts";
import { changeAccountEmail } from "../-sql/account.ts";
import routeGroup from "../_route.ts";
import { parseSysJWT } from "@/global/jwt.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/change_email",
  async validateInput(ctx) {
    const userInfo = await ctx.get("userInfo").getValidUserSampleInfo();
    const param = await checkValueAsync(ctx.req.json(), {
      newEmail: emailChecker,
      accountToken: "string",
      emailCaptcha: emailCaptchaReplyChecker(),
    });
    await verifyAccountToken(param.accountToken, userInfo.user_id, userInfo.email);

    return { userId: userInfo.user_id, param };
  },
  async handler({ param: body, userId }): Promise<void> {
    const pass = await emailCaptchaService.verify(body.emailCaptcha, body.newEmail, EmailCaptchaType.changeEmail);
    if (!pass) throw new HttpCaptchaError();
    await changeAccountEmail(userId, body.newEmail);
  },
});
async function verifyAccountToken(
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

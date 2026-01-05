import { checkValueAsync } from "@/global/check.ts";
import { signSysJWT } from "@/global/jwt.ts";
import routeGroup from "./_route.ts";
import { emailCaptchaReplyChecker, emailCaptchaService } from "@/routers/captcha/mod.ts";
import { EmailCaptchaActionType, EmailCaptchaReply } from "@/dto.ts";
import { HttpCaptchaError } from "@/global/errors.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/sign_account_token",
  async validateInput(ctx) {
    const param = await checkValueAsync(ctx.req.json(), { emailCaptcha: emailCaptchaReplyChecker() });
    return { userInfo: ctx.get("userInfo"), body: param };
  },
  async handler({ userInfo, body }) {
    const user = await userInfo.getValidUserSampleInfo();
    await verifyCaptcha(body.emailCaptcha, user.email);
    const exp = Date.now() + 10 * 60 * 1000; // 10分钟
    const token = await signSysJWT({ userId: user.user_id, email: user.email, exp });

    return {
      account_token: token,
    };
  },
});
async function verifyCaptcha(captchaReply: EmailCaptchaReply, email: string): Promise<void> {
  const pass = await emailCaptchaService.verify(captchaReply, email, EmailCaptchaActionType.signAccountToken);
  if (!pass) throw new HttpCaptchaError();
}

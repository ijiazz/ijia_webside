import routeGroup from "../_route.ts";
import { checkValueAsync, emailChecker } from "@/global/check.ts";
import { imageCaptchaReplyChecker, imageCaptchaController } from "@/routers/captcha/mod.ts";
import { HttpCaptchaError, HttpError } from "@/global/errors.ts";
import { sendResetPassportCaptcha } from "../-services/send_email_captcha.ts";
import { user } from "@ijia/data/db";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { dbPool } from "@ijia/data/dbclient";
import { EmailCaptchaQuestion } from "@/dto/captcha.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/reset_password/email_captcha",
  validateInput(ctx) {
    return checkValueAsync(ctx.req.json(), {
      captchaReply: imageCaptchaReplyChecker(),
      email: emailChecker,
    });
  },
  async handler({ captchaReply, email }): Promise<EmailCaptchaQuestion> {
    const pass = await imageCaptchaController.verify(captchaReply);
    if (!pass) throw new HttpCaptchaError();

    const [account] = await select<{ email: string; id: number }>({ email: true, id: true })
      .from(user.name)
      .where(`email=${v(email)}`)
      .limit(1)
      .dataClient(dbPool)
      .queryRows();
    if (!account) throw new HttpError(406, "账号不存在");

    return sendResetPassportCaptcha(email, account.id);
  },
});

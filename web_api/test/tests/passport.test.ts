import { expect, beforeEach, describe } from "vitest";
import { test, Context, Api } from "../fixtures/hono.ts";
import { user } from "@ijia/data/db";
import { CreateUserProfileParam, LoginType, passportController, UserLoginParamDto } from "@/modules/passport/mod.ts";
import { applyController } from "@asla/hono-decorator";
import { emailCaptchaService } from "@/modules/captcha/mod.ts";

import { createCaptchaSession, initCaptcha } from "../__mocks__/captcha.ts";
import { loginService } from "@/modules/passport/services/passport.service.ts";
import { hashPasswordFrontEnd } from "@/modules/passport/services/password.ts";

const password_123 = await hashPasswordFrontEnd("123");

let isFist = true;
beforeEach<Context>(async ({ hono, publicDbPool }) => {
  publicDbPool; // 初始化数据库
  if (isFist) {
    await loginService.createUser("abc@qq.com", { password: password_123 });
    await initCaptcha();
    isFist = false;
  }
  applyController(hono, passportController);
});

describe("注册用户", function () {
  test("注册用户", async function ({ api }) {
    const emailAnswer = await mockSendEmailCaptcha(api, "test@ijiazz.cn");
    const result = await signup(api, { email: "test@ijiazz.cn", password: password_123, emailCaptcha: emailAnswer });
    await expect(user.select({ email: true }).where(`id=${result.userId}`).queryCount()).resolves.toBe(1);
  });
  test("必须传正确的邮件验证码", async function ({ api }) {
    await expect(
      signup(api, { email: "test@ijiazz.cn", password: password_123, emailCaptcha: { code: "123", sessionId: "111" } }),
    ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });

    const emailAnswer = await mockSendEmailCaptcha(api, "");
    await expect(
      signup(api, {
        email: "@qq.com",
        password: password_123,
        emailCaptcha: { code: "123", sessionId: emailAnswer.sessionId },
      }),
    ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });
  });
  test("不允许传错误的邮箱", async function ({ api }) {
    await expect(signup(api, { email: "@qq.com", password: password_123 }), "邮箱不正确").rejects.responseStatus(400);
  });
});
describe("登录", function () {
  test("登录需要验证码", async function ({ api }) {
    await expect(
      api["/passport/login"].post({
        body: { email: "abc@qq.com", method: LoginType.email, password: password_123 },
      }),
    ).rejects.throwErrorMatchBody(403, { code: "CAPTCHA_ERROR" });
  });
  test("密码错误，应返回提示", async function ({ api }) {
    const captcha = await createCaptchaSession();
    await expect(
      loginUseCaptcha(api, {
        email: "abc@qq.com",
        method: LoginType.email,
        password: password_123,
        captcha,
      }),
    ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
  });

  test("邮箱或学号不存在，应返回提示", async function ({ api }) {
    await expect(
      loginUseCaptcha(api, { id: "2022", method: LoginType.id, password: password_123 }),
    ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
  });
  async function loginUseCaptcha(api: Api, body: UserLoginParamDto) {
    const captcha = await createCaptchaSession();
    return api["/passport/login"].post({ body: { ...body, captcha } });
  }
});

async function mockSendEmailCaptcha(api: Api, email: string) {
  const captchaReply = await createCaptchaSession();
  const { sessionId } = await api["/passport/signup/email_captcha"].post({
    body: { captchaReply, email: email },
  });
  const emailAnswer = await emailCaptchaService.getAnswer(sessionId);

  return { code: emailAnswer!.code, sessionId };
}

function signup(api: Api, param: CreateUserProfileParam) {
  return api["/passport/signup"].post({
    body: param,
  });
}

import { expect, beforeEach, describe } from "vitest";
import { test, Context, Api, JWT_TOKEN_KEY } from "../fixtures/hono.ts";
import { user } from "@ijia/data/db";
import { CreateUserProfileParam, LoginType, passportController, UserLoginParamDto } from "@/modules/passport/mod.ts";
import { applyController } from "@asla/hono-decorator";
import { emailCaptchaService } from "@/modules/captcha/mod.ts";

import { createCaptchaSession, initCaptcha } from "../__mocks__/captcha.ts";
import { passportService } from "@/modules/passport/services/passport.service.ts";
import { hashPasswordFrontEnd } from "@/modules/passport/services/password.ts";

const AlicePassword = await hashPasswordFrontEnd("123");
const AliceEmail = "alice@ijiazz.cn";
let AliceId!: number;

beforeEach<Context>(async ({ hono, ijiaDbPool }) => {
  ijiaDbPool; // 初始化数据库
  AliceId = await passportService.createUser("alice@ijiazz.cn", { password: AlicePassword });
  await initCaptcha();
  applyController(hono, passportController);
});

describe("注册用户", function () {
  test("注册用户", async function ({ api }) {
    const emailAnswer = await mockSendEmailCaptcha(api, "test@ijiazz.cn");
    const result = await signup(api, { email: "test@ijiazz.cn", password: AlicePassword, emailCaptcha: emailAnswer });
    await expect(user.select({ email: true }).where(`id=${result.userId}`).queryCount()).resolves.toBe(1);
  });
  test("必须传正确的邮件验证码", async function ({ api }) {
    await expect(
      signup(api, {
        email: "test@ijiazz.cn",
        password: AlicePassword,
        emailCaptcha: { code: "123", sessionId: "111" },
      }),
    ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });

    const emailAnswer = await mockSendEmailCaptcha(api, "");
    await expect(
      signup(api, {
        email: "@qq.com",
        password: AlicePassword,
        emailCaptcha: { code: "123", sessionId: emailAnswer.sessionId },
      }),
    ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });
  });
  test("不允许传错误的邮箱", async function ({ api }) {
    await expect(signup(api, { email: "@qq.com", password: AlicePassword }), "邮箱不正确").rejects.responseStatus(400);
  });
});
describe("登录", function () {
  test("登录需要验证码", async function ({ api }) {
    await expect(
      api["/passport/login"].post({
        body: { email: "alice@ijiazz.cn", method: LoginType.email, password: AlicePassword },
      }),
    ).rejects.throwErrorMatchBody(403, { code: "CAPTCHA_ERROR" });
  });
  test("密码错误，应返回提示", async function ({ api }) {
    await passportService.createUser("bob@ijiazz.cn", { password: "bob123" });
    const captcha = await createCaptchaSession();
    await expect(
      loginUseCaptcha(api, {
        email: "alice@ijiazz.cn",
        method: LoginType.email,
        password: "错误的密码",
        captcha,
      }),
    ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
  });

  test("邮箱或学号不存在，应返回提示", async function ({ api }) {
    await expect(
      loginUseCaptcha(api, { id: "2022", method: LoginType.id, password: AlicePassword }),
    ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
  });
  test("已删除的用户不能登录", async function ({ api }) {
    await user.update({ is_deleted: "true" }).where(`id=2022`).query();
    await expect(
      loginUseCaptcha(api, { id: "2022", method: LoginType.id, password: AlicePassword }),
    ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
  });
  async function loginUseCaptcha(api: Api, body: UserLoginParamDto) {
    const captcha = await createCaptchaSession();
    return api["/passport/login"].post({ body: { ...body, captcha } });
  }
});

test("修改密码", async ({ api }) => {
  async function aliceLoin(api: Api, password: string) {
    const captcha = await createCaptchaSession();
    return api["/passport/login"].post({
      body: { email: AliceEmail, method: LoginType.email, password: password, captcha },
    });
  }
  const aliceToken = await passportService.signJwt(AliceId, 60);
  const newPassword = await hashPasswordFrontEnd("newPassword123");
  await api["/passport/change_password"].post({
    body: { oldPassword: AlicePassword, newPassword: newPassword },
    [JWT_TOKEN_KEY]: aliceToken,
  });
  await expect(aliceLoin(api, newPassword), "新密码登录成功").resolves.toBeTypeOf("object");
  await expect(aliceLoin(api, AlicePassword), "旧密码登录失败").responseStatus(401);
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

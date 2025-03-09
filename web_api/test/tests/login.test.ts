import { expect, beforeEach, describe } from "vitest";
import { test, Context, Api } from "../fixtures/hono.ts";
import { user, user_class_bind, dclass } from "@ijia/data/db";
import { LoginType, userController } from "@/modules/user/mod.ts";
import { applyController } from "@/hono-decorator/src/apply.ts";
import { emailCaptchaService } from "@/modules/captcha/mod.ts";

import v from "@ijia/data/yoursql";
import { createCaptchaSession, initCaptcha } from "../__mocks__/captcha.ts";
import { loginService } from "@/modules/user/services/Login.service.ts";
import { hashPasswordFrontEnd } from "@/modules/user/services/password.ts";

const password_123 = await hashPasswordFrontEnd("123");

let isFist = true;
beforeEach<Context>(async ({ hono, publicDbPool }) => {
  publicDbPool; // 初始化数据库
  if (isFist) {
    await loginService.createUser("abc@qq.com", { classId: [], password: password_123 });
    await initCaptcha();
    isFist = false;
  }
  applyController(hono, userController);
});

describe("注册用户", function () {
  test("注册用户", async function ({ api }) {
    const emailAnswer = await mockSendEmailCaptcha(api);
    const result = await api["/user/signup"].post({
      body: { email: "test@ijiazz.cn", password: password_123, emailCaptcha: emailAnswer },
    });
    await expect(user.select({ email: true }).where(`id=${result.userId}`).queryCount()).resolves.toBe(1);
  });
  test("必须传正确的邮件验证码", async function ({ api }) {
    await expect(
      api["/user/signup"].post({
        body: { email: "test@ijiazz.cn", password: password_123, emailCaptcha: { code: "123", sessionId: "111" } },
      }),
    ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });

    const emailAnswer = await mockSendEmailCaptcha(api);
    await expect(
      api["/user/signup"].post({
        body: {
          email: "@qq.com",
          password: password_123,
          emailCaptcha: { code: "123", sessionId: emailAnswer.sessionId },
        },
      }),
    ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });
  });
  test("不允许传错误的邮箱", async function ({ api }) {
    await expect(
      api["/user/signup"].post({
        body: { email: "@qq.com", password: password_123 },
      }),
      "邮箱不正确",
    ).rejects.responseStatus(400);
  });
  test("只能选择公共班级", async function ({ api }) {
    await dclass
      .insert([
        { class_name: "1", is_public: true },
        { class_name: "3", is_public: false },
      ])
      .query();

    let emailAnswer = await mockSendEmailCaptcha(api);
    await expect(
      api["/user/signup"].post({ body: { email: "test123@ijiazz.cn", classId: [3], emailCaptcha: emailAnswer } }),
      "不允许选择非公共班级",
    ).rejects.throwErrorEqualBody(403, { message: "班级不存在" });

    emailAnswer = await mockSendEmailCaptcha(api);
    const userInfo = await api["/user/signup"].post({
      body: { email: "test124@ijiazz.cn", classId: [1], emailCaptcha: emailAnswer },
    });

    const recordCount = await user_class_bind
      .select("*")
      .where([`user_id=${v(userInfo.userId)}`, `class_id=${1}`])
      .queryCount();
    expect(recordCount).toBe(1);
  });
});
describe("登录", function () {
  test("登录需要验证码", async function ({ api }) {
    await expect(
      api["/user/login"].post({
        body: { email: "abc@qq.com", method: LoginType.email, password: password_123 },
      }),
    ).rejects.throwErrorMatchBody(403, { code: "CAPTCHA_ERROR" });
  });
  test("密码错误，应返回提示", async function ({ api }) {
    const captcha = await createCaptchaSession();
    await expect(
      api["/user/login"].post({
        body: { email: "abc@qq.com", method: LoginType.email, password: password_123, captcha },
      }),
    ).rejects.throwErrorEqualBody(403, { message: "用户不存在或密码错误" });
  });

  test("邮箱或学号不存在，应返回提示", async function ({ api }) {
    const captcha = await createCaptchaSession();
    await expect(
      api["/user/login"].post({
        body: { id: "2022", method: LoginType.id, password: password_123, captcha },
      }),
    ).rejects.throwErrorEqualBody(403, { message: "用户不存在或密码错误" });
  });
});

async function mockSendEmailCaptcha(api: Api) {
  const captchaReply = await createCaptchaSession();
  const { sessionId } = await api["/user/signup/email_captcha"].post({
    body: { captchaReply, email: "abc.qq.com" },
  });
  const emailAnswer = await emailCaptchaService.getAnswer(sessionId);

  return { code: emailAnswer!.code, sessionId };
}

import { expect, beforeEach, describe } from "vitest";
import { test, Context, Api } from "../../fixtures/hono.ts";
import { user, user_blacklist } from "@ijia/data/db";
import { CreateUserProfileParam, LoginType, passportController, UserLoginParamDto } from "@/modules/passport/mod.ts";
import { applyController } from "@asla/hono-decorator";
import { emailCaptchaService } from "@/modules/captcha/mod.ts";

import { createCaptchaSession, initCaptcha } from "../../__mocks__/captcha.ts";
import { hashPasswordFrontEnd } from "@/modules/passport/services/password.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";
import v from "@ijia/data/yoursql";

const AlicePassword = await hashPasswordFrontEnd("123");

async function prepareUser(email: string, password: string = AlicePassword) {
  const userId = await createUser(email, { password: AlicePassword });
  return { userId, email, password };
}

beforeEach<Context>(async ({ hono, ijiaDbPool }) => {
  await initCaptcha();
  applyController(hono, passportController);
});

describe("注册用户", function () {
  test("注册用户", async function ({ api }) {
    const emailAnswer = await mockSignUpSendEmailCaptcha(api, "test@ijiazz.cn");
    const result = await signup(api, { email: "test@ijiazz.cn", password: AlicePassword, emailCaptcha: emailAnswer });
    await expect(user.select({ email: true }).where(`id=${result.userId}`).queryCount()).resolves.toBe(1);
  });
  test("必须传正确的邮件验证码", async function ({ api }) {
    await expect(
      signup(api, {
        email: "david@ijiazz.cn",
        password: AlicePassword,
        emailCaptcha: { code: "123", sessionId: "111" },
      }),
    ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });
  });
  test("不能使用 david 的邮箱验证码注册 bob 的邮箱", async function ({ api }) {
    const emailAnswer = await mockSignUpSendEmailCaptcha(api, "david@ijiazz.cn");
    await expect(
      signup(api, { email: "bob@ijiazz.cn", password: AlicePassword, emailCaptcha: emailAnswer }),
      "试图用 david 的邮箱验证码注册 bob 的邮箱",
    ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });
  });
  test("邮箱验证码输入错，修正后可以认证通过", async function ({ api }) {
    const emailAnswer = await mockSignUpSendEmailCaptcha(api, "david@ijiazz.cn");
    await expect(
      signup(api, {
        email: "david@ijiazz.cn",
        password: AlicePassword,
        emailCaptcha: { ...emailAnswer, code: emailAnswer.code + "abc" },
      }),
      "传错误的验证码",
    ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });
    await signup(api, { email: "david@ijiazz.cn", password: AlicePassword, emailCaptcha: emailAnswer });
  });
  test("不允许传错误的邮箱", async function ({ api }) {
    await expect(mockSignUpSendEmailCaptcha(api, "@qq.com"), "邮箱不正确").rejects.responseStatus(400);
  });
  test("已注册不能再注册", async function ({ api }) {
    const BobEmail = "bob@ijiazz.cn";
    const BobId = await createUser(BobEmail, { password: AlicePassword });
    await expect(mockSignUpSendEmailCaptcha(api, BobEmail)).responseStatus(406);

    const TestEmail = "test@ijiazz.cn";
    const emailAnswer = await mockSignUpSendEmailCaptcha(api, TestEmail);
    const TestId = await createUser(TestEmail, { password: AlicePassword }); // 立即抢注
    await expect(signup(api, { password: AlicePassword, emailCaptcha: emailAnswer, email: TestEmail })).responseStatus(
      406,
    );
  });
});
describe("登录", function () {
  test("登录需要验证码", async function ({ api }) {
    const user = await prepareUser("alice@ijiazz.cn");
    await expect(
      api["/passport/login"].post({
        body: { email: user.email, method: LoginType.email, password: user.password! },
      }),
    ).rejects.throwErrorMatchBody(403, { code: "CAPTCHA_ERROR" });
  });
  test("使用邮箱登录", async function ({ api }) {
    const userInfo = await prepareUser("alice@ijiazz.cn");
    const captcha = await createCaptchaSession();

    await loginUseCaptcha(api, {
      email: userInfo.email,
      method: LoginType.email,
      password: userInfo.password!,
      captcha,
    });
  });
  test("使用学号登录", async function ({ api }) {
    const userInfo = await prepareUser("alice@ijiazz.cn");
    const captcha = await createCaptchaSession();

    await loginUseCaptcha(api, {
      id: userInfo.userId.toString(),
      method: LoginType.id,
      password: userInfo.password!,
      captcha,
    });
  });
  test("密码错误，应返回提示", async function ({ api }) {
    await prepareUser("alice@ijiazz.cn", "bob123");
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
    const userInfo = await prepareUser("alice@ijiazz.cn");
    await user
      .update({ is_deleted: "true" })
      .where(`id=${v(userInfo.userId)}`)
      .query();
    await expect(
      loginUseCaptcha(api, { id: userInfo.userId.toString(), method: LoginType.id, password: userInfo.password! }),
    ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
  });
  test("黑名单用户不能登录", async function ({ api }) {
    const info = await prepareUser("alice@ijiazz.cn");
    await user_blacklist.insert({ user_id: info.userId, reason: "测试" }).query();
    await expect(
      loginUseCaptcha(api, { id: info.userId.toString(), method: LoginType.id, password: AlicePassword }),
    ).rejects.throwErrorEqualBody(423, { message: "账号已被冻结" });
  });
  test("无密码直接登录", async function ({ api }) {
    const userInfo = await prepareUser("alice@ijiazz.cn");
    await user
      .update({ password: "null", pwd_salt: "null" })
      .where(`id=${v(userInfo.userId)}`)
      .query();
    const captcha = await createCaptchaSession();

    const p = loginUseCaptcha(api, {
      email: userInfo.email,
      method: LoginType.email,
      password: "",
      captcha,
    });
    await expect(p).resolves.toBeTypeOf("object");
  });
  async function loginUseCaptcha(api: Api, body: UserLoginParamDto) {
    const captcha = await createCaptchaSession();
    return api["/passport/login"].post({ body: { ...body, captcha } });
  }
});

describe("重置密码", function () {
  let Alice: Awaited<ReturnType<typeof prepareUser>>;
  beforeEach<Context>(async ({ ijiaDbPool }) => {
    Alice = await prepareUser("alice@ijiazz.cn");
  });
  test("重置密码", async function ({ api }) {
    const emailCaptchaAnswer = await mockResetPasswordSendEmailCaptcha(api, Alice.email);
    const newPassword = await hashPasswordFrontEnd("newPassword123");
    await api["/passport/reset_password"].post({
      body: { newPassword: newPassword, email: Alice.email, emailCaptcha: emailCaptchaAnswer },
    });
    await expect(aliceLoin(api, newPassword), "新密码登录成功").resolves.toBeTypeOf("object");
    await expect(aliceLoin(api, AlicePassword), "旧密码登录失败").responseStatus(401);
  });
  test("重置密码必须传正确的验证码", async function ({ api }) {
    const BobEmail = "bob@ijiazz.cn";
    const BobId = await createUser(BobEmail, { password: AlicePassword });
    const newPassword = await hashPasswordFrontEnd("newPassword123"); // 想重置 bob 的密码为 newPassword123

    const emailCaptchaAnswer = await mockResetPasswordSendEmailCaptcha(api, Alice.email); // 给 Alice 发重置密码的验证码

    await expect(
      api["/passport/reset_password"].post({
        body: { newPassword: newPassword, email: BobEmail, emailCaptcha: emailCaptchaAnswer },
      }),
      "不能用 Alice 的邮箱验证码验证 Bob 的重置验证码",
    ).responseStatus(409);

    await expect(
      api["/passport/reset_password"].post({
        body: { newPassword: newPassword, email: Alice.email, emailCaptcha: { ...emailCaptchaAnswer, code: "ABC" } },
      }),
    ).responseStatus(409);

    await api["/passport/reset_password"].post({
      body: { newPassword: newPassword, email: Alice.email, emailCaptcha: emailCaptchaAnswer },
    });

    await expect(aliceLoin(api, newPassword), "新密码登录成功").resolves.toBeTypeOf("object");
    await expect(aliceLoin(api, AlicePassword), "旧密码登录失败").responseStatus(401);
  });
  test("已注销账号不能重置密码", async function ({ api }) {
    await user.update({ is_deleted: "true" }).where(`id=${Alice.userId}`).query();
    const emailCaptchaAnswer = await mockResetPasswordSendEmailCaptcha(api, Alice.email);
    const newPassword = await hashPasswordFrontEnd("newPassword123");
    await expect(
      api["/passport/reset_password"].post({
        body: { newPassword: newPassword, email: Alice.email, emailCaptcha: emailCaptchaAnswer },
      }),
      "已注销账号不能重置密码",
    ).responseStatus(409);
  });
  async function aliceLoin(api: Api, password: string) {
    const captcha = await createCaptchaSession();
    return api["/passport/login"].post({
      body: { email: Alice.email, method: LoginType.email, password: password, captcha },
    });
  }
});

async function mockSignUpSendEmailCaptcha(api: Api, email: string) {
  const captchaReply = await createCaptchaSession();
  const { sessionId } = await api["/passport/signup/email_captcha"].post({
    body: { captchaReply, email: email },
  });
  const emailAnswer = await emailCaptchaService.getAnswer(sessionId);

  return { code: emailAnswer!.code, sessionId };
}
async function mockResetPasswordSendEmailCaptcha(api: Api, email: string) {
  const captchaReply = await createCaptchaSession();
  const { sessionId } = await api["/passport/reset_password/email_captcha"].post({
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

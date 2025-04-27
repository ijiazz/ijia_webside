import { expect, beforeEach, describe } from "vitest";
import { test, Context, Api, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { LoginType, passportController } from "@/modules/passport/mod.ts";
import accountController from "@/modules/passport/account.controller.ts";
import { applyController } from "@asla/hono-decorator";
import { emailCaptchaService } from "@/modules/captcha/mod.ts";

import { createCaptchaSession, initCaptcha } from "../../__mocks__/captcha.ts";
import { hashPasswordFrontEnd } from "@/modules/passport/services/password.ts";
import { signLoginJwt } from "@/global/jwt.ts";
import { getValidUserSampleInfoByUserId } from "@/sql/user.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";
import { user } from "@ijia/data/db";

const AlicePassword = await hashPasswordFrontEnd("123");
const AliceEmail = "alice@ijiazz.cn";
let AliceId!: number;

beforeEach<Context>(async ({ hono, ijiaDbPool }) => {
  ijiaDbPool; // 初始化数据库
  AliceId = await createUser(AliceEmail, { password: AlicePassword });
  await initCaptcha();
  applyController(hono, passportController);
  applyController(hono, accountController);
});

describe("获取账号authToken", function () {
  test("获取账号authToken", async function ({ api }) {
    const aliceToken = await signLoginJwt(AliceId, 60);
    const emailCaptchaAnswer = await mockSignAuthTokenEmailSendEmailCaptcha(api, aliceToken);
    const result = await api["/passport/sign_account_token"].post({
      body: { emailCaptcha: emailCaptchaAnswer },
      [JWT_TOKEN_KEY]: aliceToken,
    });
    expect(result).toHaveProperty("account_token");
  });
  test("没有登录不能获取账号authToken", async function ({ api }) {
    const emailCaptchaAnswer = mockSignAuthTokenEmailSendEmailCaptcha(api, AlicePassword);
    await expect(emailCaptchaAnswer).responseStatus(401);
  });
});
describe("修改邮箱", async function () {
  test("修改邮箱", async function ({ api }) {
    const aliceToken = await signLoginJwt(AliceId, 60);
    const accountToken = await getAccountToken(api, aliceToken);
    const newEmail = "news@ijiazz.cn";
    const emailCaptchaAnswer = await mockChangeEmailSendEmailCaptcha(api, newEmail, aliceToken);
    await api["/passport/change_email"].post({
      body: { newEmail: newEmail, emailCaptcha: emailCaptchaAnswer, accountToken },
      [JWT_TOKEN_KEY]: aliceToken,
    });
    await expect(getUserEmail(AliceId), "成功修改邮箱").resolves.toBe(newEmail);
  });
  test("不能使用 news 的验证码来验证 bob 的邮箱", async function ({ api }) {
    const aliceToken = await signLoginJwt(AliceId, 60);
    const accountToken = await getAccountToken(api, aliceToken);
    const newEmail = "news@ijiazz.cn";
    const bobEmail = "bob@ijiazz.cn";
    const emailCaptchaAnswer = await mockChangeEmailSendEmailCaptcha(api, newEmail, aliceToken);
    const promise = api["/passport/change_email"].post({
      body: { newEmail: bobEmail, emailCaptcha: emailCaptchaAnswer, accountToken },
      [JWT_TOKEN_KEY]: aliceToken,
    });
    await expect(promise).responseStatus(418);
  });
  test("邮箱已被注册，尝试修改发送将无法发送验证码", async function ({ api }) {
    const aliceToken = await signLoginJwt(AliceId, 60);
    const accountToken = await getAccountToken(api, aliceToken);
    const BobEmail = "bob@ijiazz.cn";
    const BobId = await createUser(BobEmail, { password: AlicePassword });
    await expect(mockChangeEmailSendEmailCaptcha(api, AliceEmail, aliceToken), "邮箱已被注册").responseStatus(406);
  });
  test("邮箱不能修改成已注册的邮箱", async function ({ api }) {
    const aliceToken = await signLoginJwt(AliceId, 60);
    const accountToken = await getAccountToken(api, aliceToken);

    const BobEmail = "bob@ijiazz.cn";

    const emailCaptchaAnswer = await mockChangeEmailSendEmailCaptcha(api, BobEmail, aliceToken);

    // 获取验证码后立即抢注一个账号
    const newsId = await createUser(BobEmail, { password: AlicePassword });
    await expect(
      api["/passport/change_email"].post({
        body: { newEmail: BobEmail, emailCaptcha: emailCaptchaAnswer, accountToken },
        [JWT_TOKEN_KEY]: aliceToken,
      }),
    ).responseStatus(409);
  });
  test("已注销账号不能修改邮箱", async function ({ api }) {
    const aliceToken = await signLoginJwt(AliceId, 60);
    const accountToken = await getAccountToken(api, aliceToken);
    await user.update({ is_deleted: "true" }).where(`id=${AliceId}`).query();
    const newEmail = "news@ijiazz.cn";
    const emailCaptchaAnswer = await mockChangeEmailSendEmailCaptcha(api, newEmail, aliceToken);
    const promise = api["/passport/change_email"].post({
      body: { newEmail: newEmail, emailCaptcha: emailCaptchaAnswer, accountToken },
      [JWT_TOKEN_KEY]: aliceToken,
    });
    await expect(promise).responseStatus(423);
  });

  function getUserEmail(id: number) {
    return getValidUserSampleInfoByUserId(id).then((res) => res.email);
  }
});

describe("修改密码", function () {
  test("修改密码", async ({ api }) => {
    const aliceToken = await signLoginJwt(AliceId, 60);
    const newPassword = await hashPasswordFrontEnd("newPassword123");
    await api["/passport/change_password"].post({
      body: { oldPassword: AlicePassword, newPassword: newPassword },
      [JWT_TOKEN_KEY]: aliceToken,
    });
    await expect(aliceLoin(api, newPassword), "新密码登录成功").resolves.toBeTypeOf("object");
    await expect(aliceLoin(api, AlicePassword), "旧密码登录失败").responseStatus(401);
  });
  test("修改密码必须输入正确的旧密码", async ({ api }) => {
    const aliceToken = await signLoginJwt(AliceId, 60);
    const newPassword = await hashPasswordFrontEnd("newPassword123");
    const promise = api["/passport/change_password"].post({
      body: { oldPassword: await hashPasswordFrontEnd("errorPassword"), newPassword: newPassword },
      [JWT_TOKEN_KEY]: aliceToken,
    });
    await expect(promise, "旧密码错误").responseStatus(401);
  });
});

async function aliceLoin(api: Api, password: string) {
  const captcha = await createCaptchaSession();
  return api["/passport/login"].post({
    body: { email: AliceEmail, method: LoginType.email, password: password, captcha },
  });
}

async function mockChangeEmailSendEmailCaptcha(api: Api, email: string, token: string) {
  const captchaReply = await createCaptchaSession();
  const { sessionId } = await api["/passport/change_email/email_captcha"].post({
    body: { captchaReply, email: email },
    [JWT_TOKEN_KEY]: token,
  });
  const emailAnswer = await emailCaptchaService.getAnswer(sessionId);

  return { code: emailAnswer!.code, sessionId };
}
async function mockSignAuthTokenEmailSendEmailCaptcha(api: Api, token: string) {
  const captchaReply = await createCaptchaSession();
  const { sessionId } = await api["/passport/sign_account_token/email_captcha"].post({
    body: { captchaReply },
    [JWT_TOKEN_KEY]: token,
  });
  const emailAnswer = await emailCaptchaService.getAnswer(sessionId);

  return { code: emailAnswer!.code, sessionId };
}
async function getAccountToken(api: Api, userToken: string) {
  const emailAnswer = await mockSignAuthTokenEmailSendEmailCaptcha(api, userToken);
  const res = await api["/passport/sign_account_token"].post({
    body: { emailCaptcha: emailAnswer },
    [JWT_TOKEN_KEY]: userToken,
  });
  return res.account_token;
}

import { expect, beforeEach, describe } from "vitest";
import { test, Context, Api, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { LoginType, passportController } from "@/modules/passport/mod.ts";
import accountController from "@/modules/passport/account.controller.ts";
import { applyController } from "@asla/hono-decorator";
import { emailCaptchaService } from "@/modules/captcha/mod.ts";

import { createCaptchaSession, initCaptcha } from "../../__mocks__/captcha.ts";
import { hashPasswordFrontEnd } from "@/modules/passport/services/password.ts";
import { getValidUserSampleInfoByUserId } from "@/sql/user.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";
import { user } from "@ijia/data/db";
import { getUniqueEmail, getUniqueName, prepareUniqueUser } from "test/fixtures/user.ts";
import { update } from "@asla/yoursql";

beforeEach<Context>(async ({ hono, publicDbPool }) => {
  await initCaptcha();
  applyController(hono, passportController);
  applyController(hono, accountController);
});

describe("获取账号authToken", function () {
  test("获取账号authToken", async function ({ api }) {
    const alice = await prepareUniqueUser("alice");
    const emailCaptchaAnswer = await mockSignAuthTokenEmailSendEmailCaptcha(api, alice.token);
    const result = await api["/passport/sign_account_token"].post({
      body: { emailCaptcha: emailCaptchaAnswer },
      [JWT_TOKEN_KEY]: alice.token,
    });
    expect(result).toHaveProperty("account_token");
  });
  test("没有登录不能获取账号authToken", async function ({ api }) {
    const alice = await prepareUniqueUser("alice");
    const emailCaptchaAnswer = mockSignAuthTokenEmailSendEmailCaptcha(api, "");
    await expect(emailCaptchaAnswer).responseStatus(401);
  });
});
describe("修改邮箱", async function () {
  test("修改邮箱", async function ({ api }) {
    const alice = await prepareUniqueUser("alice");
    const accountToken = await getAccountToken(api, alice.token);

    const newEmail = getUniqueEmail("news");
    const emailCaptchaAnswer = await mockChangeEmailSendEmailCaptcha(api, newEmail, alice.token);
    await api["/passport/change_email"].post({
      body: { newEmail: newEmail, emailCaptcha: emailCaptchaAnswer, accountToken },
      [JWT_TOKEN_KEY]: alice.token,
    });
    await expect(getUserEmail(alice.id), "成功修改邮箱").resolves.toBe(newEmail);
  });
  test("不能使用 news 的验证码来验证 bob 的邮箱", async function ({ api }) {
    const alice = await prepareUniqueUser("alice");
    const accountToken = await getAccountToken(api, alice.token);
    const newEmail = getUniqueEmail("news");
    const bobEmail = getUniqueEmail("bob");
    const emailCaptchaAnswer = await mockChangeEmailSendEmailCaptcha(api, newEmail, alice.token);
    const promise = api["/passport/change_email"].post({
      body: { newEmail: bobEmail, emailCaptcha: emailCaptchaAnswer, accountToken },
      [JWT_TOKEN_KEY]: alice.token,
    });
    await expect(promise).responseStatus(418);
  });
  test("邮箱已被注册，尝试修改发送将无法发送验证码", async function ({ api }) {
    const alice = await prepareUniqueUser("alice");
    const bob = await prepareUniqueUser("bob");
    await expect(mockChangeEmailSendEmailCaptcha(api, alice.email, alice.token), "邮箱已被注册").responseStatus(406);
  });
  test("邮箱不能修改成已注册的邮箱", async function ({ api }) {
    const alice = await prepareUniqueUser("alice");
    const accountToken = await getAccountToken(api, alice.token);

    const BobEmail = "bob@ijiazz.cn";

    const emailCaptchaAnswer = await mockChangeEmailSendEmailCaptcha(api, BobEmail, alice.token);

    // 获取验证码后立即抢注一个账号
    const newsId = await createUser(BobEmail, { password: alice.email });
    await expect(
      api["/passport/change_email"].post({
        body: { newEmail: BobEmail, emailCaptcha: emailCaptchaAnswer, accountToken },
        [JWT_TOKEN_KEY]: alice.token,
      }),
    ).responseStatus(409);
  });
  test("修改的邮箱大写字母域名会被转换成小写", async function ({ api, publicDbPool }) {
    const alice = await prepareUniqueUser("alice");
    const accountToken = await getAccountToken(api, alice.token);

    const prefix = getUniqueName("Abc1");
    const newEmail = `${prefix}@IJIAzz.中文`;

    const emailCaptchaAnswer = await mockChangeEmailSendEmailCaptcha(api, newEmail, alice.token);
    await api["/passport/change_email"].post({
      body: { newEmail: newEmail, emailCaptcha: emailCaptchaAnswer, accountToken },
      [JWT_TOKEN_KEY]: alice.token,
    });
    await expect(getUserEmail(alice.id), "成功修改邮箱变为小写").resolves.toBe(`${prefix.toLowerCase()}@ijiazz.中文`);
  });
  test("已注销账号不能修改邮箱", async function ({ api, publicDbPool }) {
    const alice = await prepareUniqueUser("alice");
    const accountToken = await getAccountToken(api, alice.token);
    await update(user.name).set({ is_deleted: "true" }).where(`id=${alice.id}`).client(publicDbPool);
    const newEmail = "news@ijiazz.cn";
    const emailCaptchaAnswer = await mockChangeEmailSendEmailCaptcha(api, newEmail, alice.token);
    const promise = api["/passport/change_email"].post({
      body: { newEmail: newEmail, emailCaptcha: emailCaptchaAnswer, accountToken },
      [JWT_TOKEN_KEY]: alice.token,
    });
    await expect(promise).responseStatus(423);
  });

  function getUserEmail(id: number) {
    return getValidUserSampleInfoByUserId(id).then((res) => res.email);
  }
});

describe("修改密码", function () {
  test("修改密码", async ({ api }) => {
    const pwd = await hashPasswordFrontEnd("newPassword123");
    const alice = await prepareUniqueUser("alice", { password: pwd });
    const newPassword = await hashPasswordFrontEnd("newPassword123");
    await api["/passport/change_password"].post({
      body: { oldPassword: pwd, newPassword: newPassword },
      [JWT_TOKEN_KEY]: alice.token,
    });
    await expect(aliceLoin(api, alice.email, newPassword), "新密码登录成功").resolves.toBeTypeOf("object");
    await expect(aliceLoin(api, alice.email, alice.email), "旧密码登录失败").responseStatus(401);
  });
  test("修改密码必须输入正确的旧密码", async ({ api }) => {
    const alice = await prepareUniqueUser("alice");
    const newPassword = await hashPasswordFrontEnd("newPassword123");
    const promise = api["/passport/change_password"].post({
      body: { oldPassword: await hashPasswordFrontEnd("errorPassword"), newPassword: newPassword },
      [JWT_TOKEN_KEY]: alice.token,
    });
    await expect(promise, "旧密码错误").responseStatus(401);
  });
});

async function aliceLoin(api: Api, email: string, password: string) {
  const captcha = await createCaptchaSession();
  return api["/passport/login"].post({
    body: { email: email, method: LoginType.email, password: password, captcha },
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

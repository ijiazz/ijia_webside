import { expect, beforeEach } from "vitest";
import { test, Context, Api } from "../../fixtures/hono.ts";

import { passportRoutes, captchaRoutes } from "@/routers/mod.ts";

import { initCaptcha } from "../../__mocks__/captcha.ts";
import { createUser } from "@/routers/passport/-sql/signup.ts";
import { hashPasswordFrontEnd } from "@/routers/passport/-services/password.ts";
import { emailCaptchaService } from "@/routers/captcha/mod.ts";
import { getUniqueEmail, getUniqueName } from "test/fixtures/user.ts";
import { getValidUserSampleInfoByUserId } from "@/sql/user.ts";
import { select } from "@asla/yoursql";
import { EmailCaptchaActionType, CreateUserProfileParam } from "@/dto.ts";
import { mockSendEmailCaptcha } from "./_mocks/captcha.ts";

const AlicePassword = "123";

beforeEach<Context>(async ({ hono, publicDbPool }) => {
  await initCaptcha();
  passportRoutes.apply(hono);
  captchaRoutes.apply(hono);
});

test("注册用户", async function ({ api, publicDbPool }) {
  const email = getUniqueEmail("alice");
  const emailAnswer = await mockSignUpSendEmailCaptcha(api, email);
  const result = await signup(api, { email: email, password: AlicePassword, emailCaptcha: emailAnswer });
  await expect(
    publicDbPool.queryCount(select({ email: true }).from("public.user").where(`id=${result.userId}`)),
  ).resolves.toBe(1);
});
test("必须传正确的邮件验证码", async function ({ api, publicDbPool }) {
  await expect(
    signup(api, {
      email: getUniqueEmail("alice"),
      password: AlicePassword,
      emailCaptcha: { code: "123", sessionId: "111" },
    }),
  ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });
});

test("大写字母域名会被转换成小写", async function ({ api, publicDbPool }) {
  const prefix = getUniqueName("Abc12中文");
  const email = `${prefix}@IJIAZZ.中文`;
  const emailAnswer = await mockSignUpSendEmailCaptcha(api, email);
  const result = await signup(api, {
    email: email,
    password: "Abc123",
    emailCaptcha: emailAnswer,
  });

  const info = await getValidUserSampleInfoByUserId(result.userId);
  expect(info.email).toBe(`${prefix.toLowerCase()}@ijiazz.中文`);
});
test("不能使用一个用户的邮箱验证码注册另一个用户的邮箱", async function ({ api, publicDbPool }) {
  const emailAnswer = await mockSignUpSendEmailCaptcha(api, getUniqueEmail("alice"));
  await expect(
    signup(api, { email: getUniqueEmail("bob"), password: AlicePassword, emailCaptcha: emailAnswer }),
    "试图用 alice 的邮箱验证码注册 bob 的邮箱",
  ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });
});
test("邮箱验证码输入错，修正后可以认证通过", async function ({ api, publicDbPool }) {
  const email = getUniqueEmail("alice");
  const emailAnswer = await mockSignUpSendEmailCaptcha(api, email);
  await expect(
    signup(api, {
      email: email,
      password: AlicePassword,
      emailCaptcha: { ...emailAnswer, code: emailAnswer.code + "abc" },
    }),
    "传错误的验证码",
  ).rejects.throwErrorMatchBody(403, { message: "验证码错误" });
  await signup(api, { email: email, password: AlicePassword, emailCaptcha: emailAnswer });
});
test("不允许传错误的邮箱", async function ({ api, publicDbPool }) {
  await expect(mockSignUpSendEmailCaptcha(api, "@qq.com"), "邮箱不正确").rejects.responseStatus(400);
});
test("已注册不能再注册", async function ({ api, publicDbPool }) {
  const BobEmail = getUniqueEmail("bob");
  const BobId = await createUser(BobEmail, { password: AlicePassword });
  await expect(mockSignUpSendEmailCaptcha(api, BobEmail)).responseStatus(406);

  const TestEmail = getUniqueEmail("test");
  const emailAnswer = await mockSignUpSendEmailCaptcha(api, TestEmail);
  const TestId = await createUser(TestEmail, { password: AlicePassword }); // 立即抢注
  await expect(signup(api, { password: AlicePassword, emailCaptcha: emailAnswer, email: TestEmail })).responseStatus(
    406,
  );
});
async function signup(api: Api, param: CreateUserProfileParam) {
  return api["/passport/signup"].post({
    body: { ...param, password: param.password ? await hashPasswordFrontEnd(param.password) : undefined },
  });
}
async function mockSignUpSendEmailCaptcha(api: Api, email: string) {
  const { sessionId } = await mockSendEmailCaptcha(api, email, EmailCaptchaActionType.signup);
  const emailAnswer = await emailCaptchaService.getAnswer(sessionId);

  return { code: emailAnswer!.code, sessionId };
}

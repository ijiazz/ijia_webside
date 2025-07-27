import { expect, beforeEach } from "vitest";
import { test, Context, Api } from "../../fixtures/hono.ts";
import { user } from "@ijia/data/db";
import { LoginType, passportController, ResetPasswordParam } from "@/modules/passport/mod.ts";
import { applyController } from "@asla/hono-decorator";

import { createCaptchaSession, initCaptcha } from "../../__mocks__/captcha.ts";
import { hashPasswordFrontEnd } from "@/modules/passport/services/password.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";
import { emailCaptchaService } from "@/modules/captcha/mod.ts";

const AlicePassword = await hashPasswordFrontEnd("123");

beforeEach<Context>(async ({ hono, publicDbPool }) => {
  applyController(hono, passportController);
  await initCaptcha();
});
test("重置密码", async function ({ api }) {
  const Alice = await prepareUniqueUser("alice");
  const emailCaptchaAnswer = await mockResetPasswordSendEmailCaptcha(api, Alice.email);
  const newPassword = await hashPasswordFrontEnd("newPassword123");
  await commitResetPassword(api, { newPassword: newPassword, email: Alice.email, emailCaptcha: emailCaptchaAnswer });
  await expect(aliceLoin(api, Alice.email, newPassword), "新密码登录成功").resolves.toBeTypeOf("object");
  await expect(aliceLoin(api, Alice.email, AlicePassword), "旧密码登录失败").responseStatus(401);
});
test("重置密码必须传正确的验证码", async function ({ api }) {
  const Alice = await prepareUniqueUser("alice");
  const Bob = await prepareUniqueUser("bob", AlicePassword);
  const newPassword = await hashPasswordFrontEnd("newPassword123"); // 想重置 bob 的密码为 newPassword123

  const emailCaptchaAnswer = await mockResetPasswordSendEmailCaptcha(api, Alice.email); // 给 Alice 发重置密码的验证码

  await expect(
    commitResetPassword(api, { newPassword: newPassword, email: Bob.email, emailCaptcha: emailCaptchaAnswer }),
    "不能用 Alice 的邮箱验证码验证 Bob 的重置验证码",
  ).responseStatus(409);
  await expect(
    commitResetPassword(api, {
      newPassword: newPassword,
      email: Alice.email,
      emailCaptcha: { ...emailCaptchaAnswer, code: "ABC" },
    }),
  ).responseStatus(409);
  await commitResetPassword(api, { newPassword: newPassword, email: Alice.email, emailCaptcha: emailCaptchaAnswer });

  await expect(aliceLoin(api, Alice.email, newPassword), "新密码登录成功").resolves.toBeTypeOf("object");
  await expect(aliceLoin(api, Alice.email, AlicePassword), "旧密码登录失败").responseStatus(401);
});
test("已注销账号不能重置密码", async function ({ api }) {
  const Alice = await prepareUniqueUser("alice");
  await user.update({ is_deleted: "true" }).where(`id=${Alice.userId}`).query();
  const emailCaptchaAnswer = await mockResetPasswordSendEmailCaptcha(api, Alice.email);
  const newPassword = await hashPasswordFrontEnd("newPassword123");

  await expect(
    commitResetPassword(api, { newPassword: newPassword, email: Alice.email, emailCaptcha: emailCaptchaAnswer }),
    "已注销账号不能重置密码",
  ).responseStatus(409);
});
async function aliceLoin(api: Api, usename: string, password: string) {
  const captcha = await createCaptchaSession();
  return api["/passport/login"].post({
    body: { email: usename, method: LoginType.email, password: password, captcha },
  });
}

function commitResetPassword(api: Api, param: ResetPasswordParam) {
  return api["/passport/reset_password"].post({
    body: param,
  });
}
async function mockResetPasswordSendEmailCaptcha(api: Api, email: string) {
  const captchaReply = await createCaptchaSession();
  const { sessionId } = await api["/passport/reset_password/email_captcha"].post({
    body: { captchaReply, email: email },
  });
  const emailAnswer = await emailCaptchaService.getAnswer(sessionId);

  return { code: emailAnswer!.code, sessionId };
}
let uniqueId = 1;
async function prepareUniqueUser(emailName: string, password: string = AlicePassword) {
  const email = `${emailName}-${uniqueId++}@ijiazz.cn`;
  const id = await createUser(email, { password, nickname: emailName });
  return { userId: id, email, password };
}

import { expect, beforeEach } from "vitest";
import { test, Context, Api } from "../../fixtures/hono.ts";
import { user, user_blacklist } from "@ijia/data/db";
import { passportController } from "@/modules/passport/mod.ts";
import { applyController } from "@asla/hono-decorator";

import { createCaptchaSession, initCaptcha } from "../../__mocks__/captcha.ts";
import { hashPasswordFrontEnd } from "@/modules/passport/services/password.ts";
import { getUniqueName, prepareUniqueUser } from "test/fixtures/user.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { update } from "@asla/yoursql";
import { LoginType, UserLoginParamDto } from "@/dto/passport.ts";

const AlicePassword = await hashPasswordFrontEnd("123");

async function prepareUniqueUserWithPwd(emailName: string, password: string = AlicePassword) {
  return prepareUniqueUser(emailName, { password });
}

beforeEach<Context>(async ({ hono, publicDbPool }) => {
  await initCaptcha();
  applyController(hono, passportController);
});

test("登录需要验证码", async function ({ api, publicDbPool }) {
  const user = await prepareUniqueUserWithPwd("alice");
  await expect(
    api["/passport/login"].post({
      body: { email: user.email, method: LoginType.email, password: user.password! },
    }),
  ).rejects.throwErrorMatchBody(403, { code: "CAPTCHA_ERROR" });
});
test("使用邮箱登录", async function ({ api, publicDbPool }) {
  const userInfo = await prepareUniqueUserWithPwd("alice");
  const captcha = await createCaptchaSession();

  await loginUseCaptcha(api, {
    email: userInfo.email,
    method: LoginType.email,
    password: userInfo.password!,
    captcha,
  });
});
test("使用大写域名邮箱登录", async function ({ api, publicDbPool }) {
  const emailName = getUniqueName("alice");
  const userInfo = await createUser(`${emailName}@ijiazz.中文`, { password: AlicePassword });
  const captcha = await createCaptchaSession();

  await loginUseCaptcha(api, {
    email: `${emailName}@IJIAZZ.中文`,
    method: LoginType.email,
    password: AlicePassword,
    captcha,
  });
});
test("使用学号登录", async function ({ api, publicDbPool }) {
  const userInfo = await prepareUniqueUserWithPwd("alice");
  const captcha = await createCaptchaSession();

  await loginUseCaptcha(api, {
    id: userInfo.id.toString(),
    method: LoginType.id,
    password: userInfo.password!,
    captcha,
  });
});
test("密码错误，应返回提示", async function ({ api, publicDbPool }) {
  await prepareUniqueUserWithPwd("alice", "bob123");
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

test("邮箱或学号不存在，应返回提示", async function ({ api, publicDbPool }) {
  await expect(
    loginUseCaptcha(api, { id: "2022", method: LoginType.id, password: AlicePassword }),
  ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
});
test("已删除的用户不能登录", async function ({ api, publicDbPool }) {
  const userInfo = await prepareUniqueUserWithPwd("alice@ijiazz.cn");
  await update(user.name)
    .set({ is_deleted: "true" })
    .where(`id=${v(userInfo.id)}`)
    .client(publicDbPool);
  await expect(
    loginUseCaptcha(api, { id: userInfo.id.toString(), method: LoginType.id, password: userInfo.password! }),
  ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
});
test("黑名单用户不能登录", async function ({ api, publicDbPool }) {
  const info = await prepareUniqueUserWithPwd("alice@ijiazz.cn");
  await insertIntoValues(user_blacklist.name, { user_id: info.id, reason: "测试" }).client(publicDbPool);
  await expect(
    loginUseCaptcha(api, { id: info.id.toString(), method: LoginType.id, password: AlicePassword }),
  ).rejects.throwErrorEqualBody(423, { message: "账号已被冻结" });
});
test("无密码直接登录", async function ({ api, publicDbPool }) {
  const userInfo = await prepareUniqueUserWithPwd("alice@ijiazz.cn");
  await update(user.name)
    .set({ password: "null", pwd_salt: "null" })
    .where(`id=${v(userInfo.id)}`)
    .client(publicDbPool);
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

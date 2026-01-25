import { expect, beforeEach } from "vitest";
import { test, Context, Api } from "../../fixtures/hono.ts";
import { passportRoutes, captchaRoutes } from "@/routers/mod.ts";

import { createCaptchaSession, initCaptcha } from "../../__mocks__/captcha.ts";
import { hashPasswordFrontEnd } from "@/routers/passport/-services/password.ts";
import { getUniqueName, prepareUniqueUser } from "test/fixtures/user.ts";
import { createUser } from "@/routers/passport/-sql/signup.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { update } from "@asla/yoursql";
import { UserLoginByPasswordParam, LoginMethod, UserIdentifierType, EmailCaptchaActionType } from "@/dto.ts";
import { emailCaptchaService } from "@/routers/captcha/mod.ts";

const AlicePassword = await hashPasswordFrontEnd("123");

async function prepareUniqueUserWithPwd(emailName: string, password: string = AlicePassword) {
  return prepareUniqueUser(emailName, { password });
}

beforeEach<Context>(async ({ hono, publicDbPool }) => {
  await initCaptcha();
  passportRoutes.apply(hono);
  captchaRoutes.apply(hono);
});
test("需要验证码才能登录", async function ({ api, publicDbPool }) {
  const userInfo = await prepareUniqueUserWithPwd("alice");

  const param: UserLoginByPasswordParam = {
    user: { email: userInfo.email, type: UserIdentifierType.email },
    method: LoginMethod.password,
    password: userInfo.password,
  };
  await expect(login(api, param)).rejects.responseStatus(400);

  await expect(loginUseCaptcha(api, param)).resolves.toBeTypeOf("object");
});

test("使用邮箱和密码登录", async function ({ api, publicDbPool }) {
  const userInfo = await prepareUniqueUserWithPwd("alice");

  await loginNoCheckCaptcha(api, {
    user: { email: userInfo.email, type: UserIdentifierType.email },
    method: LoginMethod.password,
    password: userInfo.password,
  });
});
test("使用邮箱验证码登录", async function ({ api, publicDbPool }) {
  const userInfo = await prepareUniqueUser("alice");
  const captcha = await createCaptchaSession();

  const { sessionId } = await api["/captcha/email/send"].post({
    body: {
      actionType: EmailCaptchaActionType.login,
      captchaReply: captcha,
      email: userInfo.email,
    },
  });
  const code = await emailCaptchaService.getAnswer(sessionId); // 告诉服务端正确答案

  const res = await api["/passport/login"].post({
    body: {
      method: LoginMethod.emailCaptcha,
      email: userInfo.email,
      emailCaptcha: {
        sessionId,
        code: code?.code!,
      },
    },
  });
  expect(res.success).toBeTruthy();
});
test("使用大写域名邮箱加密码登录", async function ({ api, publicDbPool }) {
  const emailName = getUniqueName("alice");
  const userInfo = await createUser(`${emailName}@ijiazz.中文`, { password: AlicePassword });

  await loginNoCheckCaptcha(api, {
    user: { email: `${emailName}@IJIAZZ.中文`, type: UserIdentifierType.email },
    method: LoginMethod.password,
    password: AlicePassword,
  });
});
test("使用学号登录", async function ({ api, publicDbPool }) {
  const userInfo = await prepareUniqueUserWithPwd("alice");

  await loginNoCheckCaptcha(api, {
    user: { userId: userInfo.id, type: UserIdentifierType.userId },
    method: LoginMethod.password,
    password: userInfo.password,
  });
});
test("密码错误，应返回提示", async function ({ api, publicDbPool }) {
  await prepareUniqueUserWithPwd("alice", "bob123");
  await expect(
    loginNoCheckCaptcha(api, {
      user: { email: "alice@ijiazz.cn", type: UserIdentifierType.email },
      method: LoginMethod.password,
      password: "错误的密码",
    }),
  ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
});

test("邮箱或学号不存在，应返回提示", async function ({ api, publicDbPool }) {
  await expect(
    loginNoCheckCaptcha(api, {
      user: { userId: 2022, type: UserIdentifierType.userId },
      method: LoginMethod.password,
      password: AlicePassword,
    }),
  ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
});
test("已删除的用户不能登录", async function ({ api, publicDbPool }) {
  const userInfo = await prepareUniqueUserWithPwd("alice@ijiazz.cn");
  await publicDbPool.execute(
    update("public.user")
      .set({ is_deleted: "true" })
      .where(`id=${v(userInfo.id)}`),
  );
  await expect(
    loginNoCheckCaptcha(api, {
      user: { userId: userInfo.id, type: UserIdentifierType.userId },
      method: LoginMethod.password,
      password: userInfo.password,
    }),
  ).rejects.throwErrorEqualBody(401, { message: "账号或密码错误" });
});
test("黑名单用户不能登录", async function ({ api, publicDbPool }) {
  const info = await prepareUniqueUserWithPwd("alice@ijiazz.cn");
  await publicDbPool.execute(insertIntoValues("user_blacklist", { user_id: info.id, reason: "测试" }));
  await expect(
    loginNoCheckCaptcha(api, {
      user: { userId: info.id, type: UserIdentifierType.userId },
      method: LoginMethod.password,
      password: AlicePassword,
    }),
  ).rejects.throwErrorEqualBody(423, { message: "账号已被冻结" });
});
test("无密码直接登录", async function ({ api, publicDbPool }) {
  const userInfo = await prepareUniqueUserWithPwd("alice@ijiazz.cn");
  await publicDbPool.execute(
    update("public.user")
      .set({ password: "null", pwd_salt: "null" })
      .where(`id=${v(userInfo.id)}`),
  );

  const p = loginNoCheckCaptcha(api, {
    user: { email: userInfo.email, type: UserIdentifierType.email },
    method: LoginMethod.password,
    password: "",
  });
  await expect(p).resolves.toBeTypeOf("object");
});

async function loginNoCheckCaptcha(api: Api, body: Omit<UserLoginByPasswordParam, "captcha">) {
  return api["/passport/login"].post({ body, headers: { "X-In-Test": "1" } });
}
async function login(api: Api, body: UserLoginByPasswordParam) {
  return api["/passport/login"].post({ body });
}
async function loginUseCaptcha(api: Api, body: UserLoginByPasswordParam) {
  const captcha = await createCaptchaSession();
  return login(api, { ...body, captcha });
}

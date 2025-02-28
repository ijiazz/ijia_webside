import { expect, beforeEach } from "vitest";
import { test, Context } from "../fixtures/hono.ts";
import { imageCaptchaController } from "@/modules/captcha/mod.ts";
import { applyController } from "@/hono-decorator/src/apply.ts";
beforeEach<Context>(({ hono, ijiaDbPool }) => {
  applyController(hono, imageCaptchaController);
});

test.todo("创建用户", async function ({ api }) {
  // api["/user/self/profile"].post({ body: { email: "" } });
});
test("创建验证码会话并验证", async function ({ api }) {
  const result = await api["/captcha/image"].post();
  const value = imageCaptchaController.imageCaptcha.get(result.sessionId);
  imageCaptchaController.verify({
    sessionId: result.sessionId,
    selectedIndex: result.imageUrlList,
  });
});
test.todo("密码错误，应返回提示", async function ({ hono }) {});

import { expect, beforeEach } from "vitest";
import { test, Context } from "../fixtures/hono.ts";
import { imageCaptchaController } from "@/modules/captcha/mod.ts";
import { applyController } from "@/hono-decorator/src/apply.ts";
import { captcha_picture } from "@ijia/data/db";
import { createCaptcha } from "../__mocks__/captcha.ts";
import v from "@ijia/data/yoursql";
async function init() {
  const captcha = createCaptcha(20);
  let i = 0;
  for (; i < 3; i++) captcha[i].is_true = true;
  for (; i < 6; i++) captcha[i].is_true = false;

  await captcha_picture.insert(captcha).query(); // 前 6 张图片的真假值被确定
}
beforeEach<Context>(async ({ hono, ijiaDbPool }) => {
  applyController(hono, imageCaptchaController);
  await init();
});

test("创建验证码会话并验证", async function ({ api }) {
  const result = await api["/captcha/image"].post();

  const { yes, no, all } = await imageCaptchaController.getAnswer(result.sessionId);
  const isPass = await imageCaptchaController.verify({
    sessionId: result.sessionId,
    selectedIndex: yes,
  });
  expect(yes.length + no.length, "至少三额确定值").toBeGreaterThan(3);
  expect(all.length).toBe(9);

  expect(isPass).toBe(true);
  await expect(imageCaptchaController.imageCaptcha.get(result.sessionId), "验证通过后被删除").resolves.toBeUndefined();
});
test("验证错误", async function ({ api }) {
  const result = await api["/captcha/image"].post();

  const { no } = await imageCaptchaController.getAnswer(result.sessionId);
  const isPass = await imageCaptchaController.verify({
    sessionId: result.sessionId,
    selectedIndex: no,
  });

  expect(isPass).toBe(false);
  await expect(imageCaptchaController.imageCaptcha.get(result.sessionId), "验证后被删除").resolves.toBeUndefined();
});

test("允许选择不确定的选项", async function ({ api }) {
  const result = await api["/captcha/image"].post();

  const { all, yes, no, unknown } = await imageCaptchaController.getAnswer(result.sessionId);
  const unknownId = unknown.map((index) => all[index]);

  const unknownItems = captcha_picture
    .select<{ yes_count: number; no_count: number; id: string }>({ id: true, yes_count: true, no_count: true })
    .where(`id in (${unknownId.map((id) => v(id)).join(", ")})`)
    .orderBy("id");

  const old = await unknownItems.queryRows();
  expect(
    old.map((item) => ({ yes_count: item.yes_count, no_count: item.no_count })),
    "初始值为0",
  ).toEqual(old.map(() => ({ no_count: 0, yes_count: 0 })));

  const isPass = await imageCaptchaController.verify({
    sessionId: result.sessionId,
    selectedIndex: [...yes, ...unknown], // 把不确定的值都选上，预期这些不确定的值的 yes_count 都会加上1
  });

  expect(isPass).toBe(true);

  const news = await unknownItems.queryRows();

  expect(
    news.map((item) => item.yes_count),
    "这些不确定的值的 yes_count 都会加上1",
  ).toEqual(news.map(() => 1));
});

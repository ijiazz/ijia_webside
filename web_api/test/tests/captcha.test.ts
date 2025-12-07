import { expect, beforeEach } from "vitest";
import { test, Context } from "../fixtures/hono.ts";
import captchaRoutes, { imageCaptchaService } from "@/routers/captcha/mod.ts";
import { captcha_picture } from "@ijia/data/db";
import { initCaptcha } from "../__mocks__/captcha.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";

beforeEach<Context>(async ({ hono, ijiaDbPool }) => {
  captchaRoutes.apply(hono);
  await initCaptcha();
});

test("创建验证码会话并验证", async function ({ api }) {
  const result = await api["/captcha/image"].post();

  const { yes, no, all } = await imageCaptchaService.getAnswer(result.sessionId);
  const isPass = await imageCaptchaService.verify({
    sessionId: result.sessionId,
    selectedIndex: yes,
  });
  expect(yes.length + no.length, "至少三额确定值").toBeGreaterThan(3);
  expect(all.length).toBe(9);

  expect(isPass).toBe(true);
  await expect(imageCaptchaService.imageCaptcha.get(result.sessionId), "验证通过后被删除").resolves.toBeUndefined();
});
test("验证错误", async function ({ api }) {
  const result = await api["/captcha/image"].post();

  const { no } = await imageCaptchaService.getAnswer(result.sessionId);
  const isPass = await imageCaptchaService.verify({
    sessionId: result.sessionId,
    selectedIndex: no,
  });

  expect(isPass).toBe(false);
  await expect(imageCaptchaService.imageCaptcha.get(result.sessionId), "验证后被删除").resolves.toBeUndefined();
});

test("允许选择不确定的选项", async function ({ api, ijiaDbPool }) {
  const result = await api["/captcha/image"].post();

  const { all, yes, no, unknown } = await imageCaptchaService.getAnswer(result.sessionId);
  const unknownId = unknown.map((index) => all[index]);

  const unknownItems = select<{ yes_count: number; no_count: number; id: string }>({
    id: true,
    yes_count: true,
    no_count: true,
  })
    .from(captcha_picture.name)
    .where(`id in (${unknownId.map((id) => v(id)).join(", ")})`)
    .orderBy("id");

  const old = await ijiaDbPool.queryRows(unknownItems);
  expect(
    old.map((item) => ({ yes_count: item.yes_count, no_count: item.no_count })),
    "初始值为0",
  ).toEqual(old.map(() => ({ no_count: 0, yes_count: 0 })));

  const isPass = await imageCaptchaService.verify({
    sessionId: result.sessionId,
    selectedIndex: [...yes, ...unknown], // 把不确定的值都选上，预期这些不确定的值的 yes_count 都会加上1
  });

  expect(isPass).toBe(true);

  const news = await ijiaDbPool.queryRows(unknownItems);

  expect(
    news.map((item) => item.yes_count),
    "这些不确定的值的 yes_count 都会加上1",
  ).toEqual(news.map(() => 1));
});

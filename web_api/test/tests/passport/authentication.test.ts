import { beforeEach, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import { userController } from "@/modules/user/mod.ts";
import { applyController } from "@asla/hono-decorator";
import { HoFetch } from "@asla/hofetch";
import { signAccessToken } from "@/global/jwt.ts";
import { afterTime } from "evlib";

beforeEach<Context>(async ({ hono }) => {
  applyController(hono, userController);
});
test("token 过期应返回 401", async function ({ hoFetch }) {
  await expect(getInfo(hoFetch, "errToken")).responseStatus(401);
});

test("过期的token请求后应返回删除 cookie", async function ({ hoFetch }) {
  const token = await signAccessToken(1, { survivalSeconds: 0.05 });
  await afterTime(50);
  const res = await getInfo(hoFetch, token.token);

  expect(res.status).toBe(401);
  const setCookie = res.headers.getSetCookie().filter((item) => item.includes("access_token="))[0];

  expect(setCookie, "token值置空").toMatch(/access_token=;/);
  expect(setCookie, "时间应设置为0").toMatch(/Max-Age=0;/);
});

test("刷新 token 后应返回新的 token", async function ({ hoFetch }) {
  const token = await signAccessToken(1, { survivalSeconds: 0.05, refreshSurvivalSeconds: 2 });
  await afterTime(50);
  const res = await getInfo(hoFetch, token.token);
  expect(res.status).toBe(200);
  const setCookie = res.headers.getSetCookie().filter((item) => item.includes("access_token="))[0];
  expect(setCookie, "token值不应置空").toMatch(/access_token=\w+/);
  expect(setCookie, "Max-Age 应大于0").toMatch(/Max-Age=[1-9][0-9]*;/);
});

async function getInfo(hoFetch: HoFetch, tokenStr: string = "") {
  return hoFetch.fetch("/user/basic_info", { headers: { cookie: "access_token=" + tokenStr }, allowFailed: true });
}

import { beforeEach, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import userRoutes from "@/routers/user/mod.ts";
import { HoFetch } from "@asla/hofetch";
import { signAccessToken } from "@/global/jwt.ts";
import { afterTime } from "evlib";

import { insertIntoValues } from "@/sql/utils.ts";
import { REQUEST_AUTH_KEY } from "@/dto.ts";

beforeEach<Context>(async ({ hono }) => {
  userRoutes.apply(hono);
});
test("token 过期应返回 401", async function ({ hoFetch }) {
  await expect(getInfo(hoFetch, "errToken")).responseStatus(401);
});

test("过期的token请求后应返回删除 cookie", async function ({ hoFetch }) {
  const token = await signAccessToken(1, { survivalSeconds: 0.05 });
  await afterTime(50);
  const res = await getInfo(hoFetch, token.token);

  expect(res.status).toBe(401);
  const setCookie = res.headers.getSetCookie().filter((item) => item.includes(`${REQUEST_AUTH_KEY}=`))[0];

  expect(setCookie, "token值置空").toMatch(new RegExp(`${REQUEST_AUTH_KEY}=;`));
  expect(setCookie, "时间应设置为0").toMatch(/Max-Age=0;/);
});

test("刷新 token 后应返回新的 token", async function ({ hoFetch, ijiaDbPool }) {
  await ijiaDbPool.execute(insertIntoValues("public.user", { id: 1, email: "test@example" }));
  const token = await signAccessToken(1, { survivalSeconds: 0.05, refreshSurvivalSeconds: 2 });
  await afterTime(50);
  const res = await getInfo(hoFetch, token.token);
  expect(res.status).toBe(200);
  const setCookie = res.headers.getSetCookie().filter((item) => item.includes(`${REQUEST_AUTH_KEY}=`))[0];
  expect(setCookie, "token值不应置空").toMatch(new RegExp(`${REQUEST_AUTH_KEY}=\\w+`));
  expect(setCookie, "Max-Age 应大于0").toMatch(/Max-Age=[1-9][0-9]*;/);
});

async function getInfo(hoFetch: HoFetch, tokenStr: string = "") {
  return hoFetch.fetch("/user/basic_info", {
    headers: { cookie: `${REQUEST_AUTH_KEY}=${tokenStr}` },
    allowFailed: true,
  });
}

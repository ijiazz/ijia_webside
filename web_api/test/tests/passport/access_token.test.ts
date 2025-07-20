import { expect, test } from "vitest";
import {
  verifyAccessToken,
  signAccessToken,
  signSysJWT,
  ACCESS_TOKEN_VERSION,
  refreshAccessToken,
  SignInfo,
  parseSysJWT,
} from "@/global/jwt.ts";
import { afterTime } from "evlib";

const userId = 123;
test("version 不匹配，直接过期", async () => {
  const token = await signSysJWT({
    userId: userId.toString(),
    issueTime: Math.floor(Date.now() / 1000),
    survivalSeconds: 1,
    version: ACCESS_TOKEN_VERSION + 1,
  } satisfies SignInfo);

  const { result } = await verifyAccessToken(token);
  expect(result.isExpired).toBe(true);
  expect(result.needRefresh).toBe(false);
});

test("无效 token 验证", async () => {
  await expect(() => verifyAccessToken("invalid.token.value")).rejects.toThrowError();
});

test("只存在 exp 如给 exp 过期直接过期", async () => {
  const liveMs = 100;
  const { token, maxAge } = await signAccessToken(userId, { survivalSeconds: liveMs / 1000 });
  expect(maxAge).toBe(liveMs / 1000);
  {
    const { result } = await verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(false);
  }
  await afterTime(liveMs + 1);

  {
    const { result } = await verifyAccessToken(token);
    expect(result.isExpired).toBe(true);
    expect(result.needRefresh).toBe(false);
  }
});

test("不会过期的 token 验证", async () => {
  {
    const { token, maxAge } = await signAccessToken(userId, { survivalSeconds: 0 });
    expect(maxAge).toBeUndefined();
    const { result } = await verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(false);
  }
  {
    const { token } = await signAccessToken(userId);
    const { result } = await verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(false);
  }
});

test("设置在期限内令牌刷新", async function () {
  const liveMs = 100;
  const { token, maxAge } = await signAccessToken(userId, {
    survivalSeconds: liveMs / 1000,
    refreshSurvivalSeconds: 1,
  });
  expect(maxAge).greaterThan(0);
  await afterTime(liveMs + 1);
  {
    const { result } = await verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(true);
  }

  await afterTime(liveMs);
  {
    const { result } = await verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(true);
  }
  await afterTime(800);
  {
    const { result } = await verifyAccessToken(token);
    expect(result.isExpired).toBe(true);
    expect(result.needRefresh).toBe(false);
  }
});
test("refreshAccessToken 只更新颁发时间", async function () {
  const liveMs = 100;
  const { token } = await signAccessToken(userId, { survivalSeconds: liveMs / 1000, refreshKeepAliveSeconds: 0.5 }); // 500 毫秒内保活
  await afterTime(200);
  const { info } = await verifyAccessToken(token);
  let { token: token2 } = await refreshAccessToken(info);

  const info2 = await parseSysJWT(token2);
  const { issueTime: t1, ...infoReset } = info;
  const { issueTime: t2, ...info2Reset } = info2;
  expect(infoReset).toEqual(info2Reset);
  expect(t2, "refreshAccessToken 只更新颁发时间").greaterThan(t1);
});
test("设置需要保活的令牌刷新", async function () {
  const liveMs = 100;
  const { token, maxAge } = await signAccessToken(userId, {
    survivalSeconds: liveMs / 1000,
    refreshKeepAliveSeconds: 0.5,
  }); // 500 毫秒内保活

  expect(maxAge).toBe(0.5);
  await afterTime(200);
  const { result, info } = await verifyAccessToken(token);
  expect(result.isExpired).toBe(false);
  expect(result.needRefresh).toBe(true);
  let { token: token2 } = await refreshAccessToken(info);

  await afterTime(300);

  {
    const { result } = await verifyAccessToken(token); // 超过保活时间
    expect(result.isExpired).toBe(true);
    expect(result.needRefresh).toBe(false);
  }
  {
    const { result } = await verifyAccessToken(token2);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(true);
  }
});

test("同时设置了 refreshKeepAliveSeconds 和 refreshSurvivalSeconds", async function () {
  const liveMs = 100;
  let { token, maxAge } = await signAccessToken(userId, {
    survivalSeconds: liveMs / 1000,
    refreshKeepAliveSeconds: 0.5,
    refreshSurvivalSeconds: 1,
  }); // 500 毫秒内保活。2秒内可刷新
  expect(maxAge).greaterThan(0);
  {
    await afterTime(400);
    const { result, info } = await verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(true);
    token = await refreshAccessToken(info).then((res) => res.token);
  }
  {
    await afterTime(400); //800
    const { result, info } = await verifyAccessToken(token);
    expect(result.isExpired).toBe(false);
    expect(result.needRefresh).toBe(true);
    token = await refreshAccessToken(info).then((res) => res.token);
  }
  {
    await afterTime(400); //1200
    const { result, info } = await verifyAccessToken(token);
    expect(result.isExpired).toBe(true);
    expect(result.needRefresh).toBe(false);
  }
});

test("refreshSurvivalSeconds 如果小于 refreshKeepAliveSeconds 应抛出异常", async function () {
  await expect(() =>
    signAccessToken(userId, {
      refreshKeepAliveSeconds: 200,
      refreshSurvivalSeconds: 100,
    }),
  ).rejects.toThrowError("refreshSurvivalSeconds must be greater than refreshKeepAliveSeconds");
});

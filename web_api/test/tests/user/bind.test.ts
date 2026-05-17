import { expect, beforeEach } from "vitest";
import { test, Context, Api, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { Platform, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import userRoutes from "@/routers/user/mod.ts";
import { bindPlatformAccount } from "@/routers/user/mod.ts";

import { getUserClassId } from "./util.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { select, update } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
import { BindPlatformParam } from "@/dto.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";

beforeEach<Context>(async ({ hono, ijiaDbPool }) => {
  userRoutes.apply(hono);
});

test("绑定检查", async function ({ api }) {
  const Alice = await prepareUniqueUser("abc@qq.com", {});
  await initPlatformAccount(Alice.id);
  function AliceBindCheck() {
    return api["/user/bind_platform/check"].post({
      body: { platformList: [{ platform: Platform.douYin, platformUseId: "sec_0" }] },
      [JWT_TOKEN_KEY]: Alice.token,
    });
  }

  await expect(AliceBindCheck()).resolves.toMatchObject({
    platformUser: { platform: Platform.douYin, pla_uid: "d0" },
  });
});
test("绑定", async function ({ api }) {
  const Alice = await prepareUniqueUser("abc@qq.com", {});
  await initPlatformAccount(Alice.id);
  await binAccount(api, { platform: Platform.douYin, pla_uid: "d0" }, Alice.token);
  await expect(getUserBindCount(Alice.id), "成功绑定第1个账号").resolves.toBe(1);

  await binAccount(api, { platform: Platform.douYin, pla_uid: "d1" }, Alice.token);
  await expect(getUserBindCount(Alice.id), "成功绑定第2个账号").resolves.toBe(2);

  await expect(binAccount(api, { platform: Platform.douYin, pla_uid: "d2" }, Alice.token)).responseStatus(403);
  await expect(getUserBindCount(Alice.id)).resolves.toBe(2);
});
test("后一个账号解除绑定需要删除选择的公共班级和评论统计", async function ({ api, ijiaDbPool }) {
  const Alice = await prepareUniqueUser("abc@qq.com", {});
  await initPlatformAccount(Alice.id);
  await binAccount(api, { platform: Platform.douYin, pla_uid: "d0" }, Alice.token);
  const classes = await dbPool
    .queryRows(
      insertIntoValues("public.class", [
        { class_name: "1", parent_class_id: PUBLIC_CLASS_ROOT_ID },
        { class_name: "4" },
      ]).returning("*"),
    )
    .then((res) => res.map((item) => item.id));

  await api["/user/profile"].patch({
    body: { comment_stat_enabled: true, primary_class_id: classes[0] },
    [JWT_TOKEN_KEY]: Alice.token,
  });
  await dbPool.queryCount(insertIntoValues("user_class_bind", [{ class_id: classes[1], user_id: Alice.id }])); // 绑定一个非公共班级

  await api["/user/bind_platform"].delete({
    body: { bindKey: `${Platform.douYin}-d0` },
    [JWT_TOKEN_KEY]: Alice.token,
  }); // 解除绑定

  await expect(getUserBindCount(Alice.id), "成功解绑").resolves.toBe(0);
  await expect(getUserClassId(Alice.id), "解绑后只删除了公共班级，非公共班级保留").resolves.toEqual([classes[1]]);
});
// 暂时不处理
test.skip("绑定自己已绑定的", async function ({ api, ijiaDbPool }) {
  const Alice = await prepareUniqueUser("abc@qq.com", {});

  function updateSignature(pla_uid: string, signature: string) {
    return dbPool.queryCount(
      update("pla_user")
        .set({ signature: v(signature) })
        .where(`pla_uid=${v(pla_uid)}`),
    );
  }
  await binAccount(api, { platform: Platform.douYin, pla_uid: "d1" }, Alice.token);

  const Bob = await prepareUniqueUser("bind_existed@qq.com", {});

  await expect(updateSignature("d1", `IJIA学号：<${Bob.id}>`)).resolves.toBe(1);

  await binAccount(api, { platform: Platform.douYin, pla_uid: "d1" }, Bob.token);

  await expect(getUserBindCount(Bob.id), "新绑定的用户成功绑定").resolves.toBe(1);
  await expect(getUserBindCount(Alice.id), "原来绑定的用户被取消绑定").resolves.toBe(0);

  await expect(binAccount(api, { platform: Platform.douYin, pla_uid: "d1" }, Bob.token)).responseStatus(409);
});
test("同步信息", async function ({ api, ijiaDbPool }) {
  const Alice = await prepareUniqueUser("abc@qq.com", {});
  await ijiaDbPool.queryCount(
    insertIntoValues("pla_user", [
      { pla_uid: "alice", platform: Platform.douYin, user_name: "Alice" },
      { pla_uid: "bob", platform: Platform.douYin, user_name: "Bob" },
    ]),
  );
  await bindPlatformAccount(Alice.id, Platform.douYin, "alice", true);

  await api["/user/profile/sync"].post({
    body: { bindKey: `${Platform.douYin}-alice` },
    [JWT_TOKEN_KEY]: Alice.token,
  });

  await expect(getUserInfo(Alice.id), "成功同步平台账号").resolves.toMatchObject({
    nickname: "Alice",
  });

  await expect(
    api["/user/profile/sync"].post({
      body: { bindKey: `${Platform.douYin}-bob` },
      [JWT_TOKEN_KEY]: Alice.token,
    }),
    "不允许同步自己没绑定的账号",
  ).responseStatus(403);
  await expect(getUserInfo(Alice.id), "仍然使用之前的印象").resolves.toMatchObject({
    nickname: "Alice",
  });
  function getUserInfo(uid: number) {
    return dbPool
      .queryRows(
        select({ avatar: true, nickname: true })
          .from("public.user")
          .where(`id=${v(uid)}`),
      )
      .then((res) => res[0]);
  }
});
function getUserBindCount(userId: number) {
  return dbPool.queryCount(
    select("*")
      .from("user_platform_bind")
      .where(`user_id=${v(userId)}`),
  );
}
function binAccount(api: Api, account: BindPlatformParam["account"], token: string) {
  return api["/user/bind_platform"].post({
    body: { account },
    [JWT_TOKEN_KEY]: token,
  });
}
async function initPlatformAccount(userId: number) {
  await dbPool.queryRows(
    insertIntoValues("pla_user", [
      {
        platform: Platform.douYin,
        extra: { sec_uid: "sec_0" },
        pla_uid: "d0",
        signature: "abc\nIJIA学号：<" + userId + ">\n12c",
      },
      {
        platform: Platform.douYin,
        extra: { sec_uid: "sec_1" },
        pla_uid: "d1",
        signature: "abcIJIA学号：<" + userId + ">12c",
      },
      { platform: Platform.douYin, extra: { sec_uid: "sec_2" }, pla_uid: "d2", signature: "IJIA学号：" },
    ]),
  );
}

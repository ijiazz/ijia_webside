import { expect, beforeEach } from "vitest";
import { test, Context, Api, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import {
  dclass,
  pla_user,
  Platform,
  PUBLIC_CLASS_ROOT_ID,
  user,
  user_class_bind,
  user_platform_bind,
} from "@ijia/data/db";
import { BindPlatformParam, userController } from "@/modules/user/mod.ts";
import { applyController } from "@asla/hono-decorator";
import { bindPlatformAccount } from "@/modules/user/user.service.ts";

import { v } from "@ijia/data/yoursql";
import { signAccessToken } from "@/global/jwt.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";
import { getUserClassId } from "./util.ts";

let AliceId: number;
let AliceToken: string;
beforeEach<Context>(async ({ hono, ijiaDbPool }) => {
  AliceId = await createUser("abc@qq.com", {});
  AliceToken = await signAccessToken(AliceId, { survivalSeconds: 60 * 100 * 60 }).then((res) => res.token);

  await pla_user
    .insert([
      {
        platform: Platform.douYin,
        extra: { sec_uid: "sec_0" },
        pla_uid: "d0",
        signature: "abc\nIJIA学号：<" + AliceId + ">\n12c",
      },
      {
        platform: Platform.douYin,
        extra: { sec_uid: "sec_1" },
        pla_uid: "d1",
        signature: "abcIJIA学号：<" + AliceId + ">12c",
      },
      { platform: Platform.douYin, extra: { sec_uid: "sec_2" }, pla_uid: "d2", signature: "IJIA学号：" },
    ])
    .query();

  applyController(hono, userController);
});

test("绑定检查", async function ({ api }) {
  function AliceBindCheck() {
    return api["/user/bind_platform/check"].post({
      body: { platformList: [{ platform: Platform.douYin, platformUseId: "sec_0" }] },
      [JWT_TOKEN_KEY]: AliceToken,
    });
  }

  await expect(AliceBindCheck()).resolves.toMatchObject({
    platformUser: { platform: Platform.douYin, pla_uid: "d0" },
  });
});
test("绑定", async function ({ api }) {
  await AliceBind(api, { platform: Platform.douYin, pla_uid: "d0" });
  await expect(getUserBindCount(AliceId), "成功绑定第1个账号").resolves.toBe(1);

  await AliceBind(api, { platform: Platform.douYin, pla_uid: "d1" });
  await expect(getUserBindCount(AliceId), "成功绑定第2个账号").resolves.toBe(2);

  await expect(AliceBind(api, { platform: Platform.douYin, pla_uid: "d2" })).responseStatus(403);
  await expect(getUserBindCount(AliceId)).resolves.toBe(2);
});
test("后一个账号解除绑定需要删除选择的公共班级和评论统计", async function ({ api }) {
  await AliceBind(api, { platform: Platform.douYin, pla_uid: "d0" });
  const classes = await dclass
    .insert([{ class_name: "1", parent_class_id: PUBLIC_CLASS_ROOT_ID }, { class_name: "4" }])
    .returning("*")
    .queryRows()
    .then((res) => res.map((item) => item.id));

  await api["/user/profile"].patch({
    body: { comment_stat_enabled: true, primary_class_id: classes[0] },
    [JWT_TOKEN_KEY]: AliceToken,
  });
  await user_class_bind.insert([{ class_id: classes[1], user_id: AliceId }]).queryCount(); // 绑定一个非公共班级

  await api["/user/bind_platform"].delete({
    body: { bindKey: `${Platform.douYin}-d0` },
    [JWT_TOKEN_KEY]: AliceToken,
  }); // 解除绑定

  await expect(getUserBindCount(AliceId), "成功解绑").resolves.toBe(0);
  await expect(getUserClassId(AliceId), "解绑后只删除了公共班级，非公共班级保留").resolves.toEqual([classes[1]]);
});
// 暂时不处理
test.skip("绑定自己已绑定的", async function ({ api }) {
  function userBind(userToken: string, platform: BindPlatformParam["account"]) {
    return api["/user/bind_platform"].post({
      body: { account: platform },
      [JWT_TOKEN_KEY]: userToken,
    });
  }
  function updateSignature(pla_uid: string, signature: string) {
    return pla_user
      .update({ signature: v(signature) })
      .where(`pla_uid=${v(pla_uid)}`)
      .queryCount();
  }
  await userBind(AliceToken, { platform: Platform.douYin, pla_uid: "d1" });

  const BobId = await createUser("bind_existed@qq.com", {});
  const BobToken = await signAccessToken(BobId, { survivalSeconds: 60 * 60 }).then((res) => res.token);

  await expect(updateSignature("d1", `IJIA学号：<${BobId}>`)).resolves.toBe(1);

  await userBind(BobToken, { platform: Platform.douYin, pla_uid: "d1" });

  await expect(getUserBindCount(BobId), "新绑定的用户成功绑定").resolves.toBe(1);
  await expect(getUserBindCount(AliceId), "原来绑定的用户被取消绑定").resolves.toBe(0);

  await expect(userBind(BobToken, { platform: Platform.douYin, pla_uid: "d1" })).responseStatus(409);
});
test("同步信息", async function ({ api, ijiaDbPool }) {
  await pla_user
    .insert([
      { pla_uid: "alice", platform: Platform.douYin, user_name: "Alice" },
      { pla_uid: "bob", platform: Platform.douYin, user_name: "Bob" },
    ])
    .queryCount();
  await bindPlatformAccount(AliceId, Platform.douYin, "alice", true);

  await api["/user/profile/sync"].post({
    body: { bindKey: `${Platform.douYin}-alice` },
    [JWT_TOKEN_KEY]: AliceToken,
  });

  await expect(getUserInfo(AliceId), "成功同步平台账号").resolves.toMatchObject({
    nickname: "Alice",
  });

  await expect(
    api["/user/profile/sync"].post({
      body: { bindKey: `${Platform.douYin}-bob` },
      [JWT_TOKEN_KEY]: AliceToken,
    }),
    "不允许同步自己没绑定的账号",
  ).responseStatus(403);
  await expect(getUserInfo(AliceId), "仍然使用之前的印象").resolves.toMatchObject({
    nickname: "Alice",
  });
  function getUserInfo(uid: number) {
    return user
      .select({ avatar: true, nickname: true })
      .where(`id=${v(uid)}`)
      .queryRows()
      .then((res) => res[0]);
  }
});
function getUserBindCount(userId: number) {
  return user_platform_bind
    .select("*")
    .where(`user_id=${v(userId)}`)
    .queryCount();
}
function AliceBind(api: Api, account: BindPlatformParam["account"]) {
  return api["/user/bind_platform"].post({
    body: { account },
    [JWT_TOKEN_KEY]: AliceToken,
  });
}

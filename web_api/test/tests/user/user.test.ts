import { expect, beforeEach } from "vitest";
import { test, Context, Api, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { dclass, pla_user, Platform, PUBLIC_CLASS_ROOT_ID, user_class_bind, user_platform_bind } from "@ijia/data/db";
import userRoutes from "@/routers/user/mod.ts";

import { getUserPublicClassId } from "./util.ts";
import { prepareUniqueUser } from "test/fixtures/user.ts";
import { insertIntoValues } from "@/sql/utils.ts";
import { UpdateUserProfileParam } from "@/dto.ts";

beforeEach<Context>(async ({ hono, publicDbPool }) => {
  userRoutes.apply(hono);
});
test("获取用户信息", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const classes = await publicDbPool
    .queryRows(
      insertIntoValues(dclass.name, [
        { class_name: "1", parent_class_id: PUBLIC_CLASS_ROOT_ID },
        { class_name: "2" },
        { class_name: "3" },
      ]).returning("*"),
    )
    .then((res) => res.map((item) => item.id));

  await publicDbPool.queryRows(
    insertIntoValues(
      user_class_bind.name,
      classes.map((class_id) => ({ class_id, user_id: alice.id })),
    ),
  );

  await expect(apiGetBasicInfo(api, alice.token)).resolves.toMatchObject({
    user_id: alice.id,
    is_official: false,
    primary_class: {
      class_id: classes[0],
      class_name: "1",
    },
  });

  await expect(apiGetProfile(api, alice.token)).resolves.toMatchObject({
    user_id: alice.id,
    is_official: false,
    primary_class: {
      class_id: classes[0],
      class_name: "1",
    },
  });
});
test("获取用户信息-绑定账号后", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  await publicDbPool.queryCount(
    insertIntoValues(pla_user.name, [
      { pla_uid: "1", platform: Platform.douYin },
      { pla_uid: "2", platform: Platform.douYin },
      { pla_uid: "3", platform: Platform.douYin },
    ]),
  );
  await publicDbPool.queryCount(
    insertIntoValues(user_platform_bind.name, [{ pla_uid: "1", platform: Platform.douYin, user_id: alice.id }]),
  );

  await expect(apiGetBasicInfo(api, alice.token)).resolves.toMatchObject({
    user_id: alice.id,
    is_official: true,
  });
  await expect(apiGetProfile(api, alice.token)).resolves.toMatchObject({
    user_id: alice.id,
    is_official: true,
    bind_accounts: [{ avatar_url: null, pla_uid: "1", platform: Platform.douYin, user_name: null }],
  });
});
test("只能选择公共班级，且公共班级只能选一个", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const classes = await publicDbPool
    .queryRows(
      insertIntoValues(dclass.name, [
        { class_name: "1", parent_class_id: PUBLIC_CLASS_ROOT_ID },
        { class_name: "2", parent_class_id: PUBLIC_CLASS_ROOT_ID },
        { class_name: "3" },
        { class_name: "4" },
      ]).returning("*"),
    )
    .then((res) => res.map((item) => item.id));

  await expect(apiUpdateProfile(api, { primary_class_id: classes[2] }, alice.token), "只能选择公共班级").responseStatus(
    409,
  );

  await apiUpdateProfile(api, { primary_class_id: classes[0] }, alice.token);
  await expect(getUserPublicClassId(alice.id), "成功绑定").resolves.toEqual([classes[0]]);

  await apiUpdateProfile(api, { primary_class_id: classes[1] }, alice.token);
  await expect(getUserPublicClassId(alice.id), "已更新").resolves.toEqual([classes[1]]);
});

function apiUpdateProfile(api: Api, body: UpdateUserProfileParam, token?: string) {
  return api["/user/profile"].patch({ body: body, [JWT_TOKEN_KEY]: token });
}

function apiGetProfile(api: Api, token?: string) {
  return api["/user/profile"].get({ [JWT_TOKEN_KEY]: token });
}

function apiGetBasicInfo(api: Api, token?: string) {
  return api["/user/basic_info"].get({ [JWT_TOKEN_KEY]: token });
}

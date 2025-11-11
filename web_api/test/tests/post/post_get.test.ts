import { beforeEach, expect } from "vitest";
import { test, Context, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";
import { post } from "@ijia/data/db";

import { postController } from "@/modules/post/mod.ts";
import { prepareUniqueUser } from "../../fixtures/user.ts";
import { PostItemDto, PostUserInfo } from "@/api.ts";
import { createPost, preparePost, testGetPost, testGetSelfPost } from "./utils/prepare_post.ts";
import { update } from "@asla/yoursql";
beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
});

test("匿名帖子只有自己能看到用户信息", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");

  const { id } = await createPost(api, { content_text: "匿名", is_anonymous: true }, alice.token);

  const aliceView = await testGetPost(api, id, alice.token);

  expect(aliceView.author, "自己可以看到自己发布的匿名作品的用户信息").toMatchObject({
    user_id: alice.id.toString(),
    user_name: alice.nickname,
  } satisfies Partial<PostUserInfo>);
  expect(aliceView.config.is_anonymous).toBe(true);
  {
    const bobView = await testGetPost(api, id, bob.token);
    expect(bobView.author, "bob不能看到别人发布发布的匿名作品的用户信息").toBeNull();
    expect(bobView.config.is_anonymous).toBe(true);
    expect(bobView.config.is_anonymous).toBe(true);
  }
  {
    const view = await testGetPost(api, id);
    expect(view.author, "未登录不能看到别人发布发布的匿名作品的用户信息").toBeNull();
    expect(view.config.is_anonymous).toBe(true);
    expect(view.config.is_anonymous).toBe(true);
  }
});

test("未登录用户查看自己的作品应返回空", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  await createPost(api, { content_text: "111" }, alice.token);

  const res = await api["/post/list"].get({ query: { self: true } });
  expect(res.items).toHaveLength(0);
  expect(res.needLogin).toBe(true);
});

test("审核中的帖子只有自己能查看", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");

  const { id } = await createPost(api, { content_text: "test1分组" }, alice.token);

  await update(post.name)
    .set({ is_reviewing: "true" })
    .where([`id=${id}`])
    .client(publicDbPool)
    .queryCount();
  const aliceView = await testGetSelfPost(api, id, alice.token);
  expect(aliceView.post_id).toBe(id);
  expect(aliceView.status).toMatchObject({
    is_reviewing: true,
    review_pass: null,
  } satisfies Partial<PostItemDto["status"]>);

  await expect(testGetPost(api, id, alice.token), "审核中的帖子，自己不能在公共查询中获取").resolves.toBe(undefined);
  await expect(testGetPost(api, id, bob.token), "审核中的帖子，其他人无法查看").resolves.toBe(undefined);
  await expect(testGetPost(api, id), "审核中的帖子，游客无法查看").resolves.toBe(undefined);
});
test("审核失败的帖子只有自己能查看", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { id } = await createPost(api, { content_text: "test" }, alice.token);

  await update(post.name)
    .set({ is_review_pass: "false" })
    .where([`id=${id}`])
    .client(publicDbPool)
    .query();

  const aliceView = await testGetSelfPost(api, id, alice.token);
  expect(aliceView.post_id).toBe(id);
  expect(aliceView.status).toMatchObject({
    is_reviewing: false,
    review_pass: false,
  } satisfies Partial<PostItemDto["status"]>);

  await expect(testGetPost(api, id, alice.token), "审核失败的帖子，自己不能在公共查询中获取").resolves.toBe(undefined);
  await expect(testGetPost(api, id, bob.token), "审核失败的帖子，其他人无法查看").resolves.toBe(undefined);
  await expect(testGetPost(api, id), "审核失败的帖子，游客无法查看").resolves.toBe(undefined);
});

test("已隐藏的帖子只有自己能查看", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");

  const { id } = await createPost(api, { content_text: "test1", is_hide: true }, alice.token);

  const aliceView = await testGetSelfPost(api, id, alice.token);
  expect(aliceView.post_id).toBe(id);
  expect(aliceView.status).toMatchObject({
    is_reviewing: false,
    review_pass: null,
  } satisfies Partial<PostItemDto["status"]>);

  await expect(testGetPost(api, id, alice.token), "已隐藏的帖子，自己不能在公共查询中获取").resolves.toBe(undefined);
  await expect(testGetPost(api, id, bob.token), "已隐藏的帖子，其他人无法查看").resolves.toBe(undefined);
  await expect(testGetPost(api, id), "已隐藏的帖子，游客无法查看").resolves.toBe(undefined);
});
test("获取帖子的可编辑状态", async function ({ api, publicDbPool }) {
  const { alice, post } = await preparePost(api);
  const bob = await prepareUniqueUser("bob");

  const bobView = await testGetPost(api, post.id, bob.token);
  expect(bobView.curr_user!.can_update).toBeFalsy();

  const aliceView = await testGetPost(api, post.id, alice.token);
  expect(aliceView.curr_user!.can_update).toBeTruthy();
});

test("获取自己发布的帖子列表", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  await createPost(api, { content_text: "alice" }, alice.token);
  await createPost(api, { content_text: "bob" }, bob.token);
  const { items } = await api["/post/list"].get({ query: { self: true }, [JWT_TOKEN_KEY]: bob.token });
  expect(items[0].content_text).toBe("bob");
  expect(items.length).toBe(1);
});

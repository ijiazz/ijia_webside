import { beforeEach, expect } from "vitest";
import { test, Context, Api, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";
import { DbPostCreate, post } from "@ijia/data/db";

import { postController } from "@/modules/post/mod.ts";
import { prepareUser } from "../../fixtures/user.ts";
import { PostItemDto, PostUserInfo } from "@/api.ts";
import { createPost, preparePost, testGetPost, testGetSelfPost } from "./utils/prepare_post.ts";
import { getPostList } from "@/modules/post/sql/post.ts";
beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
});

test("匿名帖子只有自己能看到用户信息", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");
  const bob = await prepareUser("bob");

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

test("审核中的帖子只有自己能查看", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");
  const bob = await prepareUser("bob");

  const { id } = await createPost(api, { content_text: "test1分组" }, alice.token);
  await post
    .update({ is_reviewing: "true" })
    .where([`id=${id}`])
    .queryCount();
  const aliceView = await testGetSelfPost(api, id, alice.token);
  expect(aliceView.asset_id).toBe(id);
  expect(aliceView.status).toMatchObject({
    is_reviewing: true,
    review_pass: null,
  } satisfies Partial<PostItemDto["status"]>);

  await expect(testGetPost(api, id, alice.token), "审核中的帖子，自己不能在公共查询中获取").resolves.toBe(undefined);
  await expect(testGetPost(api, id, bob.token), "审核中的帖子，其他人无法查看").resolves.toBe(undefined);
  await expect(testGetPost(api, id), "审核中的帖子，游客无法查看").resolves.toBe(undefined);
});
test("审核失败的帖子只有自己能查看", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");
  const bob = await prepareUser("bob");
  const { id } = await createPost(api, { content_text: "test" }, alice.token);

  await post
    .update({ is_review_pass: "false" })
    .where([`id=${id}`])
    .query();

  const aliceView = await testGetSelfPost(api, id, alice.token);
  expect(aliceView.asset_id).toBe(id);
  expect(aliceView.status).toMatchObject({
    is_reviewing: false,
    review_pass: false,
  } satisfies Partial<PostItemDto["status"]>);

  await expect(testGetPost(api, id, alice.token), "审核失败的帖子，自己不能在公共查询中获取").resolves.toBe(undefined);
  await expect(testGetPost(api, id, bob.token), "审核失败的帖子，其他人无法查看").resolves.toBe(undefined);
  await expect(testGetPost(api, id), "审核失败的帖子，游客无法查看").resolves.toBe(undefined);
});

test("已隐藏的帖子只有自己能查看", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");
  const bob = await prepareUser("bob");

  const { id } = await createPost(api, { content_text: "test1", is_hide: true }, alice.token);

  const aliceView = await testGetSelfPost(api, id, alice.token);
  expect(aliceView.asset_id).toBe(id);
  expect(aliceView.status).toMatchObject({
    is_reviewing: false,
    review_pass: null,
  } satisfies Partial<PostItemDto["status"]>);

  await expect(testGetPost(api, id, alice.token), "已隐藏的帖子，自己不能在公共查询中获取").resolves.toBe(undefined);
  await expect(testGetPost(api, id, bob.token), "已隐藏的帖子，其他人无法查看").resolves.toBe(undefined);
  await expect(testGetPost(api, id), "已隐藏的帖子，游客无法查看").resolves.toBe(undefined);
});
test("获取帖子的可编辑状态", async function ({ api, ijiaDbPool }) {
  const { alice, post } = await preparePost(api);
  const bob = await prepareUser("bob");

  const bobView = await testGetPost(api, post.id, bob.token);
  expect(bobView.curr_user!.can_update).toBeFalsy();

  const aliceView = await testGetPost(api, post.id, alice.token);
  expect(aliceView.curr_user!.can_update).toBeTruthy();
});

test("获取自己发布的帖子列表", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");
  const bob = await prepareUser("bob");
  await createPost(api, { content_text: "alice" }, alice.token);
  await createPost(api, { content_text: "bob" }, bob.token);
  const { items } = await api["/post/list"].get({ query: { self: true }, [JWT_TOKEN_KEY]: bob.token });
  expect(items[0].content_text).toBe("bob");
  expect(items.length).toBe(1);
});

test("分页获取帖子列表", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");

  const values: DbPostCreate[] = new Array(101);
  let baseDate = new Date("2023-01-01T00:00:00Z").getTime();

  values[0] = {
    user_id: alice.id,
    content_text: "test0",
    publish_time: new Date(baseDate), // 插入一个时间重复的
  };

  const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
  for (let i = 1; i < values.length; i++) {
    values[i] = {
      user_id: alice.id,
      content_text: `test${i}`,
      publish_time: new Date(baseDate),
    };
    baseDate -= oneDay; // 每个帖子的发布时间间隔1秒
  }
  await post.insert(values).query();

  const list1 = await getPostList(undefined, 10);
  expect(list1.items.length).toBe(10);
  const content = list1.items.map((item) => item.content_text);

  // test0 和 test2 的发布时间相同，且发布顺序为 0,1,2. 所以获取顺序为 1,0,2,3,4,5,6,7,8,9
  expect(content[0]).toBe("test1");
  expect(content[1]).toBe("test0");
  expect(content[2]).toBe("test2");
  expect(content[9]).toBe("test9");
  expect(list1.next_cursor).toBeTypeOf("string");

  const list2 = await getPostList(list1.next_cursor!, 11);
  expect(list2.items.length).toBe(11);
  expect(list2.items[0].content_text).toBe("test10");
  expect(list2.items[10].content_text).toBe("test20");

  function getPostList(cursor: string | undefined, number?: number) {
    return api["/post/list"].get({ query: { cursor, number }, [JWT_TOKEN_KEY]: alice.token });
  }
});
test("向前分页", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");

  const values: DbPostCreate[] = new Array(101);
  let baseDate = new Date("2023-01-01T00:00:00Z").getTime();

  const f = {
    user_id: alice.id,
    content_text: "test",
    publish_time: new Date(baseDate), // 插入一个时间重复的
  };
  await post.insert(f).query();

  const { before_cursor } = await getPostList();

  const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
  for (let i = 0; i < values.length; i++) {
    values[i] = {
      user_id: alice.id,
      content_text: `test${i}`,
      publish_time: new Date(baseDate),
    };
    baseDate += oneDay; // 每个帖子的发布时间间隔1秒
  }
  await post.insert(values).query();

  const list1 = await getPostList({ cursor: before_cursor ?? undefined, forward: true, number: 2 });

  expect(list1.items[0].content_text).toBe("test0");
  expect(list1.items[1].content_text).toBe("test1");
  expect(list1.items.length).toBe(2);
});

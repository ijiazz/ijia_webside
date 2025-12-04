import { beforeEach, expect } from "vitest";
import { test, Context, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { DbPostCreate, post } from "@ijia/data/db";

import { prepareUser } from "../../fixtures/user.ts";
import { getPostList } from "@/routers/post/-sql/post_list.sql.ts";
import { insertIntoValues } from "@/sql/utils.ts";
import postRoutes from "@/routers/post/mod.ts";

beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
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
  await insertIntoValues(post.name, values).client(ijiaDbPool);

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
  await insertIntoValues(post.name, f).client(ijiaDbPool);

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
  await insertIntoValues(post.name, values).client(ijiaDbPool);

  const list1 = await getPostList({ cursor: before_cursor ?? undefined, forward: true, number: 2 });

  expect(list1.items[0].content_text).toBe("test0");
  expect(list1.items[1].content_text).toBe("test1");
  expect(list1.items.length).toBe(2);
});

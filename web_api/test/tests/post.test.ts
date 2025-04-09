import { expect, beforeEach } from "vitest";
import { test, Context, JWT_TOKEN_KEY, Api } from "../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";
import { watching_pla_user, pla_user, USER_LEVEL, Platform, DbPlaUserCreate } from "@ijia/data/db";

import { postController } from "@/modules/post/post.controller.ts";
import { passportService } from "@/modules/passport/services/passport.service.ts";
import { insertPosts } from "../__mocks__/posts.ts";
beforeEach<Context>(async ({ hono, hoFetch, ijiaDbPool }) => {
  applyController(hono, postController);
});
const getPosts = (api: Api, option: { number: number; offset: number; token?: string }) => {
  return api["/post/god_list"].get({
    query: { number: option.number, offset: option.offset },
    [JWT_TOKEN_KEY]: option.token,
  });
};
test.skip("没有登录只能查看前 10 条", async function ({ api, ijiaDbPool }) {
  await insertMock();
  await insertPosts(20, Platform.douYin, "dy0");

  const getPost = await getPosts(api, { number: 10, offset: 0 });
  expect(getPost.needLogin).toBeFalsy();
  expect(getPost.items.length).toBe(10);

  await expect(getPosts(api, { number: 10, offset: 1 })).resolves.toEqual({ total: 20, items: [], needLogin: true });
  await expect(getPosts(api, { number: 11, offset: 0 })).resolves.toEqual({ total: 20, items: [], needLogin: true });

  const token = await passportService.signJwt(1, 10);
  const res = await getPosts(api, { number: 11, offset: 1, token });
  expect(res.items.length).toBe(11);
});
test.skip("只能查看 god 用户发布的帖子", async function ({ api, ijiaDbPool }) {
  await insertMock();
  await insertPosts(2, Platform.douYin, "dy0"); //god
  await insertPosts(2, Platform.douYin, "dy1"); //second
  await insertPosts(2, Platform.weibo, "wb0"); //god
  await insertPosts(2, Platform.weibo, "wb1"); //null

  const token = await passportService.signJwt(1, 10);

  const posts = await getPosts(api, { number: 10, offset: 0, token });
  const postsUser = posts.items.reduce(
    (s, c) => {
      s[c.author.user_id] = true;
      return s;
    },
    {} as Record<string, boolean>,
  );
  expect(postsUser).toEqual({ dy0: true, wb0: true });
});

/**
 * dy0: god
 * dy1: second
 * wb0: god
 * wb1: null
 */
async function insertMock() {
  const users: DbPlaUserCreate[] = [
    { platform: Platform.douYin, pla_uid: "dy0" },
    { platform: Platform.douYin, pla_uid: "dy1" },
    { platform: Platform.weibo, pla_uid: "wb0" },
    { platform: Platform.weibo, pla_uid: "wb1" },
  ];
  await pla_user.insert(users).query();
  await watching_pla_user
    .insert([
      { level: USER_LEVEL.god, platform: users[0].platform, pla_uid: users[0].pla_uid },
      { level: USER_LEVEL.second, platform: users[1].platform, pla_uid: users[1].pla_uid },
      { level: USER_LEVEL.god, platform: users[2].platform, pla_uid: users[2].pla_uid },
    ])
    .query();
  return users;
}

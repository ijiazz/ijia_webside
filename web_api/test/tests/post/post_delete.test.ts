import { beforeEach, expect } from "vitest";
import { test, Context, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { prepareUniqueUser } from "../../fixtures/user.ts";
import { preparePost, deletePost, getUserStatFromDb, UserStat, setPostLike, createPost } from "../../utils/post.ts";
import postRoutes from "@/routers/post/mod.ts";
beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
});

test("帖子删除后不能再获取", async function ({ api, publicDbPool }) {
  const { alice, post: postInfo } = await preparePost(api);
  await deletePost(api, postInfo.id, alice.token);
  const { items: aliceList } = await api["/post/list"].get({ [JWT_TOKEN_KEY]: alice.token });

  expect(aliceList.length, "删除后，列表中不再包含该帖子").toBe(0);

  const p = api["/post/entity/:postId"].delete({ params: { postId: postInfo.id }, [JWT_TOKEN_KEY]: alice.token });
  await expect(p, "再次删除已删除的帖子，应该返回404").responseStatus(404);
});
test("不能删除别人的帖子", async function ({ api, publicDbPool }) {
  const { alice, post: postInfo } = await preparePost(api);
  const bob = await prepareUniqueUser("bob");

  await expect(deletePost(api, postInfo.id, bob.token), "尝试删除别人的帖子，删除失败").responseStatus(404);

  await expect(
    api["/post/entity/:postId"].delete({ params: { postId: postInfo.id } }),
    "未登录，尝试删除别人的帖子，删除失败",
  ).responseStatus(401);
});
test("删除帖子后，应更新帖子作者的帖子总数", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const post = await createPost(api, { content_text: "alice" }, alice.token);

  await expect(getUserStatFromDb(alice.id)).resolves.toMatchObject({
    post_count: 1,
  } satisfies Partial<UserStat>);

  await deletePost(api, post.id, alice.token);

  await expect(getUserStatFromDb(alice.id)).resolves.toMatchObject({
    post_count: 0,
  } satisfies Partial<UserStat>);
});
test("删除帖子后，应更新帖子作者的获赞总数", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const post = await createPost(api, { content_text: "alice" }, alice.token);
  const bob = await prepareUniqueUser("bob");

  await setPostLike(api, post.id, bob.token);
  await setPostLike(api, post.id, alice.token);

  await expect(getUserStatFromDb(bob.id)).resolves.toMatchObject({
    post_like_get_count: 0,
    post_like_count: 1,
  } satisfies Partial<UserStat>);
  await expect(getUserStatFromDb(alice.id)).resolves.toMatchObject({
    post_like_get_count: 2,
    post_like_count: 1,
  } satisfies Partial<UserStat>);

  await deletePost(api, post.id, alice.token);

  await expect(getUserStatFromDb(bob.id), "bob 的点赞数应不变").resolves.toMatchObject({
    post_like_get_count: 0,
    post_like_count: 1,
  } satisfies Partial<UserStat>);
  await expect(getUserStatFromDb(alice.id), "Alice 的获赞数减少").resolves.toMatchObject({
    post_like_get_count: 0,
    post_like_count: 1,
  } satisfies Partial<UserStat>);
});

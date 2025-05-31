import { beforeEach, expect } from "vitest";
import { test, Context, Api, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";

import { postController } from "@/modules/post/mod.ts";
import { prepareUser } from "../../fixtures/user.ts";
import { deletePost, preparePost, testGetPost } from "./utils/prepare_post.ts";
import { updatePost } from "./utils/prepare_post.ts";
import { post } from "@ijia/data/db";
beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
});
test("点赞后返回的帖子信息包含点赞状态，取消点赞后点赞状态为false", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);

  const item1 = await testGetPost(api, post.id, alice.token);
  expect(item1.is_like).toBeFalsy();
  await setPostLike(api, post.id, alice.token);
  const item2 = await testGetPost(api, post.id, alice.token);
  expect(item2.is_like).toBeTruthy();

  await cancelPostLike(api, post.id, alice.token);
  const item3 = await testGetPost(api, post.id, alice.token);
  expect(item3.is_like).toBeFalsy();
});
test("已隐藏的帖子只有自己能点赞", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);
  const bob = await prepareUser("bob");
  await updatePost(api, post.id, { is_hide: true }, alice.token);

  await expect(getPostLikeCount(post.id)).resolves.toBe(0);

  await setPostLike(api, post.id, alice.token);
  await expect(getPostLikeCount(post.id)).resolves.toBe(1);
});
test("不能点赞已删除的帖子", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);

  await deletePost(api, post.id, alice.token);

  await expect(setPostLike(api, post.id, alice.token)).responseStatus(404);
  await expect(getPostLikeCount(post.id)).resolves.toBe(0);
});
test("已删除的帖子可以取消点赞", async function ({ api, ijiaDbPool }) {
  const { post: p, alice } = await preparePost(api);
  const bob = await prepareUser("bob");
  await setPostLike(api, p.id, bob.token);
  await deletePost(api, p.id, alice.token); //删除帖子

  await cancelPostLike(api, p.id, alice.token);

  await expect(getPostLikeCount(p.id)).resolves.toBe(0); //取消点赞后，点赞数归零
});

test("已隐藏的帖子可以取消点赞", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);
  const bob = await prepareUser("bob");
  await setPostLike(api, post.id, bob.token);
  await updatePost(api, post.id, { is_hide: true }, alice.token);
  await expect(getPostLikeCount(post.id)).resolves.toBe(1);

  await cancelPostLike(api, post.id, bob.token);
  await expect(getPostLikeCount(post.id)).resolves.toBe(0); //取消点赞后，点赞数归零
});
test("重复点赞将忽略", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);

  await setPostLike(api, post.id, alice.token);
  await expect(getPostLikeCount(post.id)).resolves.toBe(1);

  await setPostLike(api, post.id, alice.token);
  await expect(getPostLikeCount(post.id)).resolves.toBe(1);
});
test("重复取消点赞", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);
  await setPostLike(api, post.id, alice.token);

  await expect(getPostLikeCount(post.id)).resolves.toBe(1);

  await cancelPostLike(api, post.id, alice.token);
  await expect(getPostLikeCount(post.id)).resolves.toBe(0);

  await cancelPostLike(api, post.id, alice.token); //重复点赞将忽略
  await expect(getPostLikeCount(post.id)).resolves.toBe(0);
});

test("点赞后的作品再举报，将删除点赞", async function () {});

test("举报后的作品再点赞，将取消举报，举报认识将恢复", async function () {});

async function setPostLike(api: Api, postId: number, token: string) {
  return api["/post/like/:postId"].post({
    params: { postId: postId },
    [JWT_TOKEN_KEY]: token,
  });
}
async function cancelPostLike(api: Api, postId: number, token: string) {
  return api["/post/like/:postId"].post({
    params: { postId: postId },
    query: { isCancel: true },
    [JWT_TOKEN_KEY]: token,
  });
}
const getPostLikeCount = (postId: number) => {
  return post
    .select({ like_count: true })
    .where(`id=${postId}`)
    .queryFirstRow()
    .then((item) => item.like_count);
};

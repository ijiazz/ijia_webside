import { beforeEach, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";

import { prepareUniqueUser } from "../../fixtures/user.ts";
import { createPost, preparePost, getPublicPost, getSelfPost } from "../../utils/post.ts";
import postRoutes from "@/routers/post/mod.ts";
import { ReviewStatus, SelfPost } from "@/dto.ts";
import { commitPostReview, setPostToReviewing } from "@/routers/review/mod.ts";
beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
});

test("匿名帖子不应返回作者信息", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");

  const { id } = await createPost(api, { content_text: "匿名", is_anonymous: true }, alice.token);

  const aliceView = await getSelfPost(api, id, alice.token);

  expect(aliceView.author).toBe(null);
  expect(aliceView.config.is_anonymous).toBe(true);
  {
    const bobView = await getPublicPost(api, id, bob.token);
    expect(bobView.author, "bob不能看到别人发布发布的匿名作品的用户信息").toBeNull();
  }
  {
    const view = await getPublicPost(api, id);
    expect(view.author, "不能看到别人发布发布的匿名作品的用户信息").toBeNull();
  }
});

test("审核中的帖子只有自己能查看", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");

  const { id } = await createPost(api, { content_text: "test1分组" }, alice.token);

  await setPostToReviewing(id);

  const aliceView = await getSelfPost(api, id, alice.token);
  expect(aliceView.post_id).toBe(id);
  expect(aliceView.review?.status).toBe(ReviewStatus.pending);

  await expect(getPublicPost(api, id, alice.token), "审核中的帖子，自己不能在公共查询中获取").resolves.toBe(undefined);
  await expect(getPublicPost(api, id, bob.token), "审核中的帖子，其他人无法查看").resolves.toBe(undefined);
  await expect(getPublicPost(api, id), "审核中的帖子，游客无法查看").resolves.toBe(undefined);
});
test("审核失败的帖子只有自己能查看", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { id } = await createPost(api, { content_text: "test" }, alice.token);

  const reviewId = await setPostToReviewing(id);
  await commitPostReview({ reviewId, isPass: false, remark: "123" });
  const aliceView = await getSelfPost(api, id, alice.token);
  expect(aliceView.post_id).toBe(id);
  expect(aliceView.review).toMatchObject({
    status: ReviewStatus.rejected,
    remark: "123",
  } satisfies Partial<SelfPost["review"]>);

  await expect(getPublicPost(api, id, alice.token), "审核失败的帖子，自己不能在公共查询中获取").resolves.toBe(undefined);
  await expect(getPublicPost(api, id, bob.token), "审核失败的帖子，其他人无法查看").resolves.toBe(undefined);
  await expect(getPublicPost(api, id), "审核失败的帖子，游客无法查看").resolves.toBe(undefined);
});

test("已隐藏的帖子只有自己能查看", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");

  const { id } = await createPost(api, { content_text: "test1", is_hide: true }, alice.token);

  const aliceView = await getSelfPost(api, id, alice.token);
  expect(aliceView.post_id).toBe(id);
  expect(aliceView.review).toBe(null);

  await expect(getPublicPost(api, id, alice.token), "已隐藏的帖子，自己不能在公共查询中获取").resolves.toBe(undefined);
  await expect(getPublicPost(api, id, bob.token), "已隐藏的帖子，其他人无法查看").resolves.toBe(undefined);
  await expect(getPublicPost(api, id), "已隐藏的帖子，游客无法查看").resolves.toBe(undefined);
});
test("获取帖子的可编辑状态", async function ({ api, publicDbPool }) {
  const { alice, post } = await preparePost(api);
  const bob = await prepareUniqueUser("bob");

  const bobView = await getPublicPost(api, post.id, bob.token);
  expect(bobView.curr_user!.can_update).toBeFalsy();

  const aliceView = await getPublicPost(api, post.id, alice.token);
  expect(aliceView.curr_user!.can_update).toBeTruthy();
});

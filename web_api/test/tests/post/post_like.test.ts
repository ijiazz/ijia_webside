import { beforeEach, expect } from "vitest";
import { test, Context, Api, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";

import { postController } from "@/modules/post/mod.ts";
import { prepareUser } from "../../fixtures/user.ts";
import {
  deletePost,
  getPostReviewStatus,
  preparePost,
  reportPost,
  ReviewStatus,
  testGetPost,
} from "./utils/prepare_post.ts";
import { updatePost } from "./utils/prepare_post.ts";
import { post } from "@ijia/data/db";

beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
});
test("自己作品点赞：点赞后返回的帖子信息包含点赞状态，取消点赞后点赞状态为false", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);

  const item1 = await testGetPost(api, post.id, alice.token);
  expect(item1.curr_user?.is_like).toBeFalsy();
  const likeRes = await setPostLike(api, post.id, alice.token);
  expect(likeRes.success).toBeTruthy();
  const item2 = await testGetPost(api, post.id, alice.token);
  expect(item2.curr_user?.is_like).toBeTruthy();

  const cancelRes = await cancelPostLike(api, post.id, alice.token);
  expect(cancelRes.success).toBeTruthy();
  const item3 = await testGetPost(api, post.id, alice.token);
  expect(item3.curr_user?.is_like).toBeFalsy();
});
test("他人作品点赞：点赞后返回的帖子信息包含点赞状态，取消点赞后点赞状态为false", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);
  const bob = await prepareUser("bob");

  const item1 = await testGetPost(api, post.id, bob.token);
  expect(item1.curr_user?.is_like).toBeFalsy();
  const likeRes = await setPostLike(api, post.id, bob.token);
  expect(likeRes.success).toBeTruthy();
  const item2 = await testGetPost(api, post.id, bob.token);
  expect(item2.curr_user?.is_like).toBeTruthy();

  const cancelRes = await cancelPostLike(api, post.id, bob.token);
  expect(cancelRes.success).toBeTruthy();
  const item3 = await testGetPost(api, post.id, bob.token);
  expect(item3.curr_user?.is_like).toBeFalsy();
});
test("已隐藏的帖子只有自己能点赞", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);
  const bob = await prepareUser("bob");
  await updatePost(api, post.id, { is_hide: true }, alice.token);

  await expect(getPostLikeCount(post.id)).resolves.toBe(0);

  await setPostLike(api, post.id, bob.token);
  await expect(getPostLikeCount(post.id), "bob 无法点赞").resolves.toBe(0);

  await setPostLike(api, post.id, alice.token);
  await expect(getPostLikeCount(post.id), "alice 可以点赞").resolves.toBe(1);
});
test("不能点赞已删除的帖子", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);

  await deletePost(api, post.id, alice.token);

  const res = await setPostLike(api, post.id, alice.token);
  await expect(res.success).toBeFalsy();
  await expect(getPostLikeCount(post.id)).resolves.toBe(0);
});
test("重复点赞或取消点赞将忽略", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);

  {
    const res1 = await setPostLike(api, post.id, alice.token);
    expect(res1.success).toBeTruthy();
    await expect(getPostLikeCount(post.id)).resolves.toBe(1);

    const res2 = await setPostLike(api, post.id, alice.token);
    expect(res2.success, "重复点赞将忽略").toBeFalsy();
    await expect(getPostLikeCount(post.id)).resolves.toBe(1);
  }

  {
    const rp1 = await cancelPostLike(api, post.id, alice.token);
    expect(rp1.success).toBeTruthy();
    await expect(getPostLikeCount(post.id)).resolves.toBe(0);

    const rp2 = await cancelPostLike(api, post.id, alice.token);
    expect(rp2.success, "重复取消点赞将忽略").toBeFalsy();
    await expect(getPostLikeCount(post.id)).resolves.toBe(0);
  }
});

test("举报作品", async function ({ api, ijiaDbPool }) {
  const { post: p, alice } = await preparePost(api);
  const bob = await prepareUser("bob");

  const res = await reportPost(api, p.id, bob.token, "测试举报");
  expect(res.success).toBeTruthy();
  await expect(getPostReportCount(p.id)).resolves.toBe(1);

  const info = await testGetPost(api, p.id, bob.token);
  expect(info.curr_user?.is_report).toBeTruthy();
});

test("点赞后的作品再举报，将删除点赞", async function ({ api, ijiaDbPool }) {
  const { post, alice } = await preparePost(api);
  await setPostLike(api, post.id, alice.token);
  await reportPost(api, post.id, alice.token, "测试举报");
  await expect(getPostLikeCount(post.id)).resolves.toBe(0);
  await expect(getPostReportCount(post.id)).resolves.toBe(1);
  const info = await testGetPost(api, post.id, alice.token);
  expect(info.curr_user?.is_like, "点赞状态被删除").toBeFalsy();
  expect(info.curr_user?.is_report, "仍然是已举报状态").toBeTruthy();
});

test("有效举报人数达到3人，帖子将进入审核状态", async function ({ api, ijiaDbPool }) {
  const { post: p, alice } = await preparePost(api);

  const bo2 = await prepareUser("bob2");
  const list = [alice, bo2];
  for (let i = 0; i < list.length; i++) {
    await reportPost(api, p.id, list[i].token, "测试举报");
  }

  await expect(getPostReportCount(p.id)).resolves.toBe(2);
  const status1 = await getPostReviewStatus(p.id);
  expect(status1.is_reviewing).toBeFalsy();

  const bob3 = await prepareUser("bob3");
  await reportPost(api, p.id, bob3.token, "测试举报");
  await expect(getPostReportCount(p.id)).resolves.toBe(3);

  const status = await getPostReviewStatus(p.id);
  expect(status).toMatchObject({
    is_review_pass: null,
    is_reviewing: true,
    review_fail_count: 0,
    review_pass_count: 0,
  } satisfies Partial<ReviewStatus>);
});
test("审核通过的帖子，举报达到3人后，帖子仍然是审核通过", async function ({ api, ijiaDbPool }) {
  const { post: p, alice } = await preparePost(api);

  await post.update({ is_review_pass: "true" }).where(`id=${p.id}`).queryCount();

  const bo2 = await prepareUser("bob2");
  const bob3 = await prepareUser("bob3");
  await reportPost(api, p.id, alice.token, "测试举报");
  await reportPost(api, p.id, bo2.token, "测试举报");
  await reportPost(api, p.id, bob3.token, "测试举报");

  const status = await getPostReviewStatus(p.id);
  expect(status).toMatchObject({
    is_review_pass: true,
    is_reviewing: false,
    review_fail_count: 0,
    review_pass_count: 0,
  } satisfies Partial<ReviewStatus>);
});
test("已举报的帖子尝试取消点赞，不应删除举报记录", async function ({ api, ijiaDbPool }) {
  const { post: p, alice } = await preparePost(api);

  await reportPost(api, p.id, alice.token, "cc");

  {
    const rp1 = await cancelPostLike(api, p.id, alice.token);
    expect(rp1.success).toBeFalsy();
    await expect(getPostLikeCount(p.id)).resolves.toBe(0);
    const info = await testGetPost(api, p.id, alice.token);
    expect(info.curr_user?.is_report, "仍是已举报状态").toBeTruthy();
    await expect(getPostReportCount(p.id), "举报数没有变化").resolves.toBe(1);
  }
});
test("已举报的帖子，不能再点赞", async function ({ api, ijiaDbPool }) {
  const { post: p, alice } = await preparePost(api);

  await reportPost(api, p.id, alice.token, "测试举报");

  const rp1 = await setPostLike(api, p.id, alice.token);
  expect(rp1.success).toBeFalsy();
  const info = await testGetPost(api, p.id, alice.token);
  expect(info.stat.like_total, "点赞数为0").toBe(0);
  expect(info.curr_user?.is_like, "点赞状态为false").toBeFalsy();
  expect(info.curr_user?.is_report, "仍是已举报状态").toBeTruthy();
});

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
function getPostReportCount(postId: number) {
  return post
    .select({ report_count: "ROUND(dislike_count::NUMERIC /100, 2)" })
    .where(`id=${postId}`)
    .queryFirstRow()
    .then((item) => +item.report_count);
}

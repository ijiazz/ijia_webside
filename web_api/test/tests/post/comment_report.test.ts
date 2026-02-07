import { beforeEach, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import {
  getCommentStat,
  prepareCommentPost,
  setCommentLike,
  CommentInfo,
  reportComment,
  getCommentReviewStatus,
  CommentReviewStatus,
} from "../../utils/post.ts";
import { prepareUniqueUser } from "test/fixtures/user.ts";
import { dbPool } from "@/db/client.ts";
import { select, v } from "@asla/yoursql";
import { postRoutes, reviewRoutes, commentRoutes } from "@/routers/mod.ts";
import { commitPostCommentReview, setPostCommentToReviewing } from "@/routers/review/mod.ts";

beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
  commentRoutes.apply(hono);
});

test("举报评论", async function ({ api, publicDbPool }) {
  const { alice, post: p, action } = await prepareCommentPost(api);
  const bob = await prepareUniqueUser("bob");
  const comment = await action.createComment("abc", { token: alice.token });

  const res = await reportComment(api, comment.id, "测试举报", bob.token);
  expect(res.success).toBeTruthy();
  await expect(getCommentReviewWeight(comment.id)).resolves.toBe(100);
});
test("有效举报人数达到3人时，评论将进入审核状态", async function ({ api, publicDbPool }) {
  const { post: p, alice, action } = await prepareCommentPost(api);
  const bob = await prepareUniqueUser("bob");
  const comment = await action.createComment("abc", { token: alice.token });

  const list = [alice, bob];
  for (let i = 0; i < list.length; i++) {
    await reportComment(api, comment.id, "测试举报", list[i].token);
  }
  await expect(getCommentReviewWeight(comment.id)).resolves.toBe(200);

  await expect(getCommentReviewStatus(comment.id), "评论未在审核状态").resolves.toBeUndefined();

  const bob3 = await prepareUniqueUser("bob3");
  await reportComment(api, p.id, "测试举报", bob3.token);
  await expect(getCommentReviewWeight(comment.id)).resolves.toBe(300);
  await expect(getCommentReviewStatus(comment.id)).resolves.toMatchObject({
    is_review_pass: null,
    reviewed_time: null,
  } satisfies Partial<CommentReviewStatus>);
});

test("审核通过后，举报人数达到3人后，评论审核状态不变", async function ({ api }) {
  const { post: p, alice, action } = await prepareCommentPost(api);

  const bob = await prepareUniqueUser("bob");
  const bob2 = await prepareUniqueUser("bob2");

  const comment1 = await action.createComment("abc", { token: alice.token });

  const reviewId = await setPostCommentToReviewing(comment1.id);
  await commitPostCommentReview({ reviewId, isPass: true }); //设置审核通过

  await reportComment(api, comment1.id, "测试举报", alice.token);
  await reportComment(api, comment1.id, "测试举报", bob.token);
  await reportComment(api, comment1.id, "测试举报", bob2.token);

  await expect(getCommentReviewStatus(comment1.id)).resolves.toMatchObject({
    is_review_pass: true,
  } satisfies Partial<CommentReviewStatus>);
});

test("已举报的评论，不能再点赞", async function ({ api, publicDbPool }) {
  const { post: p, alice, action } = await prepareCommentPost(api);
  const comment = await action.createComment("abc", { token: alice.token });

  await reportComment(api, p.id, "测试举报", alice.token);

  const rp1 = await setCommentLike(api, p.id, alice.token);
  expect(rp1.success).toBeFalsy();
  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 0,
  } satisfies Partial<CommentInfo>);
});

test("已删除的评论不能举报", async function ({ api, publicDbPool }) {
  const { alice, action } = await prepareCommentPost(api);

  const comment = await action.createComment("a", { token: alice.token });
  await action.deleteComment(comment.id, { token: alice.token });

  await expect(reportComment(api, comment.id, "测试举报", alice.token)).responseStatus(400);
});
function getCommentReviewWeight(commentId: number) {
  return dbPool
    .queryFirstRow(
      select<{ report_count: number }>({ report_count: "dislike_count" }).from("post_comment").where(`id=${commentId}`),
    )
    .then((item) => +item.report_count);
}

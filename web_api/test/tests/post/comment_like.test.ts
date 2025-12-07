import { beforeEach, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import {
  getCommentStat,
  prepareCommentPost,
  setCommentLike,
  CommentInfo,
  cancelCommentLike,
  reportComment,
  getCommentReviewStatus,
  CommentReviewStatus,
} from "./utils/prepare_comment.ts";
import { prepareUniqueUser } from "test/fixtures/user.ts";
import { post_comment, post_review_info, PostReviewType } from "@ijia/data/db";
import { insertIntoValues } from "@/sql/utils.ts";
import { dbPool } from "@/db/client.ts";
import { select } from "@asla/yoursql";
import commentRoutes from "@/routers/post/comment/mod.ts";
import postRoutes from "@/routers/post/mod.ts";

beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
  commentRoutes.apply(hono);
});

test("点赞评论，评论计数应加1, 取消应减1", async function ({ api, publicDbPool }) {
  const { alice, post, action } = await prepareCommentPost(api);

  const comment = await action.createComment("a", { token: alice.token });

  await setCommentLike(api, comment.id, alice.token);

  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 1,
  } satisfies Partial<CommentInfo>);

  await cancelCommentLike(api, comment.id, alice.token);
  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 0,
  } satisfies Partial<CommentInfo>);
});
test("重复点赞评论或重复取消点赞，将忽略，评论计数不变", async function ({ api, publicDbPool }) {
  const { alice, post, action } = await prepareCommentPost(api);

  const comment = await action.createComment("a", { token: alice.token });

  {
    const { success } = await setCommentLike(api, comment.id, alice.token);
    await expect(success).toBe(true);

    await expect(getCommentStat(comment.id)).resolves.toMatchObject({
      like_count: 1,
    } satisfies Partial<CommentInfo>);
  }
  {
    const { success } = await setCommentLike(api, comment.id, alice.token);
    await expect(success).toBe(false);

    await expect(getCommentStat(comment.id)).resolves.toMatchObject({
      like_count: 1,
    } satisfies Partial<CommentInfo>);
  }
  {
    const { success } = await cancelCommentLike(api, comment.id, alice.token);
    await expect(success).toBe(true);

    await expect(getCommentStat(comment.id)).resolves.toMatchObject({
      like_count: 0,
    } satisfies Partial<CommentInfo>);
  }
  {
    const { success } = await cancelCommentLike(api, comment.id, alice.token);
    await expect(success).toBe(false);

    await expect(getCommentStat(comment.id)).resolves.toMatchObject({
      like_count: 0,
    } satisfies Partial<CommentInfo>);
  }
});

test("已删除的评论不能点赞", async function ({ api, publicDbPool }) {
  const { alice, post, action } = await prepareCommentPost(api);

  const comment = await action.createComment("a", { token: alice.token });
  await action.deleteComment(comment.id, { token: alice.token });

  await expect(setCommentLike(api, comment.id, alice.token)).resolves.toMatchObject({ success: false });

  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 0,
  } satisfies Partial<CommentInfo>);
});

test("已删除的评论可以取消点赞", async function ({ api, publicDbPool }) {
  const { alice, post, action } = await prepareCommentPost(api);
  const bob = await prepareUniqueUser("bob");
  const comment = await action.createComment("a", { token: alice.token });
  await setCommentLike(api, comment.id, alice.token);
  await setCommentLike(api, comment.id, bob.token);

  await action.deleteComment(comment.id, { token: alice.token });

  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 2,
  } satisfies Partial<CommentInfo>);

  await cancelCommentLike(api, comment.id, bob.token);

  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 1,
  } satisfies Partial<CommentInfo>);
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

  await expect(getCommentReviewStatus(p.id), "评论未在审核状态").resolves.toBeUndefined();

  const bob3 = await prepareUniqueUser("bob3");
  await reportComment(api, p.id, "测试举报", bob3.token);
  await expect(getCommentReviewWeight(comment.id)).resolves.toBe(300);
  await expect(getCommentReviewStatus(p.id)).resolves.toMatchObject({
    is_review_pass: null,
    reviewed_time: null,
  } satisfies Partial<CommentReviewStatus>);
});

test("审核通过或不通过的评论，举报人数达到3人后，评论审核状态不变", async function ({ api }) {
  const { post: p, alice, action } = await prepareCommentPost(api);

  const bob = await prepareUniqueUser("bob");
  const bob2 = await prepareUniqueUser("bob2");

  const comment1 = await action.createComment("abc", { token: alice.token });
  const comment2 = await action.createComment("abc", { token: alice.token });

  await dbPool.execute(
    insertIntoValues(post_review_info.name, [
      { type: PostReviewType.postComment, target_id: comment1.id, is_review_pass: true },
      { type: PostReviewType.postComment, target_id: comment2.id, is_review_pass: false },
    ]),
  );

  await reportComment(api, comment1.id, "测试举报", alice.token);
  await reportComment(api, comment1.id, "测试举报", bob.token);
  await reportComment(api, comment1.id, "测试举报", bob2.token);

  await reportComment(api, comment2.id, "测试举报", alice.token);
  await reportComment(api, comment2.id, "测试举报", bob.token);
  await reportComment(api, comment2.id, "测试举报", bob2.token);

  await expect(getCommentReviewStatus(comment1.id)).resolves.toMatchObject({
    is_review_pass: true,
  } satisfies Partial<CommentReviewStatus>);

  await expect(getCommentReviewStatus(comment2.id)).resolves.toMatchObject({
    is_review_pass: false,
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

function getCommentReviewWeight(commentId: number) {
  return dbPool
    .queryFirstRow(
      select<{ report_count: number }>({ report_count: "dislike_count" })
        .from(post_comment.name)
        .where(`id=${commentId}`),
    )
    .then((item) => +item.report_count);
}

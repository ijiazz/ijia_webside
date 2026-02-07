import { beforeEach, expect } from "vitest";
import { Api, Context, test } from "../../fixtures/hono.ts";
import { CommitReviewParam, CommitReviewResult, ReviewTargetType } from "@/dto.ts";
import { prepareUniqueUser } from "test/fixtures/user.ts";
import { Role } from "@/middleware/auth.ts";
import { setPostCommentToReviewing } from "@/routers/review/mod.ts";
import {
  CommentReviewStatus,
  getCommentReviewStatus,
  prepareCommentPost,
  reportComment,
  setCommentLike,
  getSelfPost,
} from "#test/utils/post.ts";
import { commentRoutes, postRoutes, reviewRoutes } from "@/routers/mod.ts";
import { commitReview, getReviewNext } from "../../utils/review.ts";
import { select, v } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);

  commentRoutes.apply(hono);
  reviewRoutes.apply(hono);
});

test("只有超级管理员可以查看评论审核和提交审核", async function ({ api, ijiaDbPool }) {
  const Bob = await prepareUniqueUser("Bob");
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const { alice, post, action } = await prepareCommentPost(api);
  const c = await action.createComment("12", { token: alice.token });
  await setPostCommentToReviewing(c.id);
  await expect(getPostCommentReviewNext(api, alice.token), "普通用户不能获取审核项").responseStatus(403);
  await expect(getPostCommentReviewNext(api, Bob.token), "Admin 用户不能获取审核项").responseStatus(403);
  await expect(getPostCommentReviewNext(api), "未登录不能获取审核项").responseStatus(401);

  const res = await getPostCommentReviewNext(api, Admin.token);
  const reviewId = res.item!.id;

  const p: CommitReviewParam = { is_passed: true, review_id: reviewId };
  await expect(commitPostCommentReviewNext(api, { ...p, remark: alice.nickname })).responseStatus(401);
  await expect(commitPostCommentReviewNext(api, { ...p, remark: alice.nickname }, alice.token)).responseStatus(403);
  await expect(commitPostCommentReviewNext(api, { ...p, remark: Bob.nickname }, Bob.token)).responseStatus(403);

  const review = await commitPostCommentReviewNext(api, { ...p, remark: Admin.nickname }, Admin.token);

  expect(review).toBeTypeOf("object");
});
test("评论审核通过后，评论应继续保留", async function ({ api, ijiaDbPool }) {
  const { alice, action, post } = await prepareCommentPost(api);
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const c = await action.createComment("需要审核的评论", { token: alice.token });
  const reviewId = await setPostCommentToReviewing(c.id);

  const firstPost = await getSelfPost(api, post.id, alice.token);
  expect(firstPost.stat.comment_total).toBe(1);
  const res = await commitPostCommentReviewNext(api, { is_passed: true, review_id: reviewId }, Admin.token);
  expect(res.success, "返回成功状态").toBe(true);
  await expect(getCommentReviewStatus(c.id)).resolves.toMatchObject({
    reviewer_id: Admin.id,
    is_review_pass: true,
  } satisfies Partial<CommentReviewStatus>);

  await expect(getCommitList(api, post.id)).resolves.toMatchObject({
    items: { length: 1 },
  });
  const afterPost = await getSelfPost(api, post.id, alice.token);
  expect(afterPost.stat.comment_total, "评论计数不变").toBe(1);
});

test("评论审核不通过，直接删除评论", async function ({ api, ijiaDbPool }) {
  const { alice, action, post } = await prepareCommentPost(api);
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const c = await action.createComment("需要审核的评论", { token: alice.token });
  const reviewId = await setPostCommentToReviewing(c.id);

  const firstPost = await getSelfPost(api, post.id, alice.token);
  expect(firstPost.stat.comment_total).toBe(1);
  await commitPostCommentReviewNext(api, { is_passed: false, review_id: reviewId }, Admin.token);

  await expect(getCommentReviewStatus(c.id)).resolves.toMatchObject({
    reviewer_id: Admin.id,
    is_review_pass: false,
  } satisfies Partial<CommentReviewStatus>);

  await expect(getCommitList(api, post.id), "评论已被删除").resolves.toMatchObject({
    items: { length: 0 },
  });
  const afterPost = await getSelfPost(api, post.id, alice.token);
  expect(afterPost.stat.comment_total, "评论计数变化").toBe(0);
});
test("评论审核通过后，应更新举报用户的审核正确/错误统计", async function ({ api, ijiaDbPool }) {
  const { alice, post, action } = await prepareCommentPost(api);
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });
  const other = await prepareUniqueUser("other");
  const users = await Promise.all(["b1", "b2", "b3"].map((name) => prepareUniqueUser(name)));

  const c1 = await action.createComment("1", { token: alice.token });
  await setCommentLike(api, c1.id, other.token);
  await Promise.all(users.map((user) => reportComment(api, c1.id, undefined, user.token)));
  const commitReview = async (pass: boolean, cid: number) => {
    const reviewId = await getCommentReviewId(cid);
    if (reviewId === null) throw new Error("评论未进入审核流程");
    return commitPostCommentReviewNext(api, { is_passed: pass, review_id: reviewId }, Admin.token);
  };
  await commitReview(true, c1.id);
  const userIdList = [other.id, users[0].id, users[1].id, users[2].id];
  await expect(getUserReportStat(userIdList)).resolves.toMatchObject({
    [other.id]: { subjective_correct_count: 0, subjective_error_count: 0 },
    [users[0].id]: { subjective_correct_count: 1, subjective_error_count: 0 },
    [users[1].id]: { subjective_correct_count: 1, subjective_error_count: 0 },
    [users[2].id]: { subjective_correct_count: 1, subjective_error_count: 0 },
  });

  const c2 = await action.createComment("2", { token: alice.token });
  await setCommentLike(api, c2.id, other.token);
  await Promise.all(users.map((user) => reportComment(api, c2.id, undefined, user.token)));
  await commitReview(false, c2.id);

  await expect(getUserReportStat(userIdList)).resolves.toMatchObject({
    [other.id]: { subjective_correct_count: 0, subjective_error_count: 0 },
    [users[0].id]: { subjective_correct_count: 1, subjective_error_count: 1 },
    [users[1].id]: { subjective_correct_count: 1, subjective_error_count: 1 },
    [users[2].id]: { subjective_correct_count: 1, subjective_error_count: 1 },
  });
});
async function getPostCommentReviewNext(api: Api, token?: string) {
  return getReviewNext(api, {
    type: ReviewTargetType.post_comment,
    token,
  });
}
async function commitPostCommentReviewNext(
  api: Api,
  option: CommitReviewParam,
  token?: string,
): Promise<CommitReviewResult> {
  return commitReview(api, {
    ...option,
    type: ReviewTargetType.post_comment,
    token,
  });
}
async function getCommitList(api: Api, postId: number) {
  return api["/post/comment/list"].get({ query: { postId: postId } });
}
async function getCommentReviewId(cid: number): Promise<number | null> {
  const r = await dbPool.queryFirstRow<{ reviewing_id: number }>(
    select("reviewing_id")
      .from("post_comment")
      .where(`id=${v(cid)}`),
  );
  return r.reviewing_id;
}
async function getUserReportStat(uid: number[]) {
  return dbPool
    .queryMap(
      select({
        user_id: true,
        subjective_correct_count: "report_subjective_correct_count",
        subjective_error_count: "report_subjective_error_count",
        correct_count: "report_correct_count",
        error_count: "report_error_count",
      })
        .from("user_profile")
        .where(`user_id IN (${v.toValues(uid)})`),
      "user_id",
    )
    .then((res) => Object.fromEntries(res));
}

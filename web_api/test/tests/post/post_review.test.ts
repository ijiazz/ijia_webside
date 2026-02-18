import { beforeEach, expect } from "vitest";
import { Api, Context, test } from "../../fixtures/hono.ts";

import postRoutes from "@/routers/post/mod.ts";
import { CommitReviewParam, CommitReviewResult, ReviewStatus, ReviewTargetType, Post } from "@/dto.ts";
import { prepareUniqueUser } from "test/fixtures/user.ts";
import { Role } from "@/middleware/auth.ts";
import { createPost, preparePost, reportPost, setPostLike, getPublicPost, getSelfPost } from "#test/utils/post.ts";
import { setPostToReviewing } from "@/routers/review/mod.ts";
import { select, v } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
import { commitReview, getReviewNext } from "../../utils/review.ts";
import { commentRoutes, reviewRoutes } from "@/routers/mod.ts";
import "#test/asserts/post.ts";

beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
  reviewRoutes.apply(hono);
  commentRoutes.apply(hono);
});
test("只有超级管理员可以查看帖子审核和提交审核", async function ({ api, publicDbPool }) {
  const Bob = await prepareUniqueUser("Bob");
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const { alice, post } = await preparePost(api);
  await setPostToReviewing(post.id);

  await expect(getPostReviewNext(api, alice.token), "普通用户不能获取审核项").responseStatus(403);
  await expect(getPostReviewNext(api, Bob.token), "Admin 用户不能获取审核项").responseStatus(403);
  await expect(getPostReviewNext(api), "未登录不能获取审核项").responseStatus(401);
  const res = await getPostReviewNext(api, Admin.token);
  const reviewId = res.item!.id;

  const p: CommitReviewParam = { is_passed: true, review_id: reviewId };
  await expect(commitPostReviewNext(api, { ...p, remark: alice.nickname })).responseStatus(401);
  await expect(commitPostReviewNext(api, { ...p, remark: alice.nickname }, alice.token)).responseStatus(403);
  await expect(commitPostReviewNext(api, { ...p, remark: Bob.nickname }, Bob.token)).responseStatus(403);

  await commitPostReviewNext(api, { ...p, remark: Admin.nickname }, Admin.token);
  await expect(post.id).postReviewStatusIs(ReviewStatus.passed);
});

test("帖子审核通过后，帖子应在公共列表可见", async function ({ api, publicDbPool }) {
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const { alice, post } = await preparePost(api, { content_text: "测试" });
  const reviewId = await setPostToReviewing(post.id);

  await commitPostReviewNext(api, { is_passed: true, review_id: reviewId, remark: "123" }, Admin.token);

  const visitor2 = await getPublicPost(api, post.id);
  expect(visitor2, "其他人能看到审核通过的帖子").toBeTypeOf("object");

  const author2 = await getSelfPost(api, post.id, alice.token);
  expect(post.id).postReviewStatusIs(ReviewStatus.passed);
  expect(author2.review?.status, "作者能看到‘审核不通过’的状态").toBe(ReviewStatus.passed);
});
test("帖子审核不通过，帖子应该为审核不通过状态", async function ({ api, publicDbPool }) {
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const { alice, post } = await preparePost(api, { content_text: "测试" });
  const reviewId = await setPostToReviewing(post.id);

  await commitPostReviewNext(api, { is_passed: false, review_id: reviewId, remark: "9999" }, Admin.token);

  const visitor2 = await getPublicPost(api, post.id);
  const author2 = await getSelfPost(api, post.id, alice.token);
  expect(visitor2, "其他人看不到审核不通过的帖子").toBeUndefined();
  expect(author2.review, "作者能看到‘审核不通过’的状态").toMatchObject({
    status: ReviewStatus.rejected,
    remark: "9999",
  } satisfies Post["review"]);
});

test("帖子审核通过后，应更新举报用户的审核正确/错误统计", async function ({ api, publicDbPool }) {
  const { alice, post } = await preparePost(api);
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });
  const other = await prepareUniqueUser("other");
  const users = await Promise.all(["b1", "b2", "b3"].map((name) => prepareUniqueUser(name)));

  await setPostLike(api, post.id, other.token);
  await Promise.all(users.map((user) => reportPost(api, post.id, user.token)));

  const commitReview = async (pass: boolean, pid: number) => {
    const reviewId = await getPostReviewId(pid);
    return commitPostReviewNext(api, { is_passed: pass, review_id: reviewId! }, Admin.token);
  };
  await commitReview(true, post.id);

  const userIdList = [other.id, users[0].id, users[1].id, users[2].id];

  await expect(getUserReportStat(userIdList)).resolves.toMatchObject({
    [other.id]: { correct_count: 0, error_count: 0 },
    [users[0].id]: { correct_count: 1, error_count: 0 },
    [users[1].id]: { correct_count: 1, error_count: 0 },
    [users[2].id]: { correct_count: 1, error_count: 0 },
  });

  const p2 = await createPost(api, { content_text: "测试" }, alice.token);
  await setPostLike(api, p2.id, other.token);
  await Promise.all(users.map((user) => reportPost(api, p2.id, user.token)));
  await commitReview(false, p2.id);

  await expect(getUserReportStat(userIdList)).resolves.toMatchObject({
    [other.id]: { correct_count: 0, error_count: 0 },
    [users[0].id]: { correct_count: 1, error_count: 1 },
    [users[1].id]: { correct_count: 1, error_count: 1 },
    [users[2].id]: { correct_count: 1, error_count: 1 },
  });
});

async function getPostReviewNext(api: Api, token?: string) {
  return getReviewNext(api, {
    type: ReviewTargetType.post,
    token,
  });
}

async function commitPostReviewNext(api: Api, option: CommitReviewParam, token?: string): Promise<CommitReviewResult> {
  return commitReview(api, {
    ...option,
    type: ReviewTargetType.post,
    token,
  });
}

async function getPostReviewId(pid: number): Promise<number | null> {
  const r = await dbPool.queryFirstRow<{ review_id: number }>(
    select("review_id")
      .from("post")
      .where(`id=${v(pid)}`),
  );
  return r.review_id;
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

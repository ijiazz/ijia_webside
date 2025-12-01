import { beforeEach, expect } from "vitest";
import { Api, Context, JWT_TOKEN_KEY, test } from "../../fixtures/hono.ts";

import postRoutes from "@/routers/post/mod.ts";
import {
  PostReviewTarget,
  CommitReviewParam,
  CommitReviewResultDto,
  PostCommentReviewTarget,
  PostItemDto,
} from "@/dto/post.ts";
import { prepareUniqueUser } from "test/fixtures/user.ts";
import { Role } from "@/middleware/auth.ts";
import {
  createPost,
  getPostReviewStatus,
  preparePost,
  reportPost,
  setPostLike,
  testGetPost,
  testGetSelfPost,
} from "./utils/prepare_post.ts";
import { setPostCommentToReviewing, setPostToReviewing } from "@/routers/post/-sql/report.sql.ts";
import {
  CommentReviewStatus,
  getCommentReviewStatus,
  prepareCommentPost,
  reportComment,
  setCommentLike,
} from "./utils/prepare_comment.ts";
import { PostReviewType, user_profile } from "@ijia/data/db";
import { select } from "@asla/yoursql";
import commentRoutes from "@/routers/post/comment/mod.ts";

beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);

  commentRoutes.apply(hono);
});
test("只有超级管理员可以查看审核和提交审核", async function ({ api, ijiaDbPool }) {
  const Bob = await prepareUniqueUser("Bob");
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const { alice, post } = await preparePost(api, { content_text: "测试" });
  await setPostToReviewing(post.id);

  await expect(getReviewNext(api, alice.token)).responseStatus(403);
  await expect(getReviewNext(api, Bob.token)).responseStatus(403);
  await expect(getReviewNext(api)).responseStatus(401);

  const res = await getReviewNext(api, Admin.token);
  const reviewId = res.next!.review_id;

  const p: CommitReviewParam & { reviewId: string } = { isPass: true, reviewId };
  await expect(commitReviewNext(api, { ...p, remark: alice.nickname })).responseStatus(401);
  await expect(commitReviewNext(api, { ...p, remark: alice.nickname }, alice.token)).responseStatus(403);
  await expect(commitReviewNext(api, { ...p, remark: Bob.nickname }, Bob.token)).responseStatus(403);

  const review = await commitReviewNext(api, { ...p, remark: Admin.nickname }, Admin.token);

  expect(review).toBeTypeOf("object");
});
test("提交审核后，应返回下一个审核项", async function ({ api, ijiaDbPool }) {
  const { alice, action, post } = await prepareCommentPost(api);
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });
  const c1 = await action.createComment("1", { token: alice.token });
  const c2 = await action.createComment("2", { token: alice.token });
  await setPostCommentToReviewing(c1.id);
  await setPostCommentToReviewing(c2.id);
  await setPostToReviewing(post.id);

  const r1 = await getReviewNext(api, Admin.token);
  expect(r1.next).toBeTypeOf("object");

  const r2 = await commitReviewNext<PostReviewTarget>(api, { isPass: true, reviewId: r1.next!.review_id }, Admin.token);
  expect(r2).toBeTypeOf("object");
  expect(r2.next).toBeTypeOf("object");

  const r3 = await commitReviewNext<PostReviewTarget>(
    api,
    { isPass: false, reviewId: r2.next!.review_id },
    Admin.token,
  );
  expect(r3).toBeTypeOf("object");
  expect(r3.next).toBeTypeOf("object");

  const r4 = await commitReviewNext<PostCommentReviewTarget>(
    api,
    { isPass: true, reviewId: r3.next!.review_id },
    Admin.token,
  );
  expect(r4).toBeTypeOf("object");
  expect(r4.next).toBeUndefined();
});
test("帖子审核通过后，帖子应在公共列表可见", async function ({ api, ijiaDbPool }) {
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const { alice, post } = await preparePost(api, { content_text: "测试" });
  const reviewId = await setPostToReviewing(post.id);

  const visitor = await testGetPost(api, post.id);
  const author = await testGetSelfPost(api, post.id, alice.token);
  expect(visitor, "其他人看不到审核中的帖子").toBeUndefined();
  expect(author.status).toMatchObject({
    is_reviewing: true,
    review_pass: null,
  } satisfies PostItemDto["status"]);

  await commitReviewNext<PostReviewTarget>(api, { isPass: true, reviewId: reviewId }, Admin.token);
  await expect(getPostReviewStatus(post.id)).resolves.toMatchObject({
    is_review_pass: true,
    is_reviewing: false,
    review: {
      is_review_pass: true,
      reviewer_id: Admin.id,
    },
  });

  const visitor2 = await testGetPost(api, post.id);
  const author2 = await testGetSelfPost(api, post.id, alice.token);
  expect(visitor2, "其他人能看到审核通过的帖子").toBeTypeOf("object");
  expect(author2.status, "作者能看到‘审核不通过’的状态").toMatchObject({
    is_reviewing: false,
    review_pass: true,
  } satisfies PostItemDto["status"]);
});
test("帖子审核不通过，帖子应该为审核不通过状态", async function ({ api, ijiaDbPool }) {
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const { alice, post } = await preparePost(api, { content_text: "测试" });
  const reviewId = await setPostToReviewing(post.id);

  const visitor = await testGetPost(api, post.id);
  const author = await testGetSelfPost(api, post.id, alice.token);
  expect(visitor, "其他人看不到审核中的帖子").toBeUndefined();
  expect(author.status).toMatchObject({
    is_reviewing: true,
    review_pass: null,
  } satisfies PostItemDto["status"]);

  await commitReviewNext<PostReviewTarget>(api, { isPass: false, reviewId: reviewId }, Admin.token);
  await expect(getPostReviewStatus(post.id)).resolves.toMatchObject({
    is_review_pass: false,
    is_reviewing: false,
    review: {
      is_review_pass: false,
      reviewer_id: Admin.id,
    },
  });

  const visitor2 = await testGetPost(api, post.id);
  const author2 = await testGetSelfPost(api, post.id, alice.token);
  expect(visitor2, "其他人看不到审核不通过的帖子").toBeUndefined();
  expect(author2.status, "作者能看到‘审核不通过’的状态").toMatchObject({
    is_reviewing: false,
    review_pass: false,
  } satisfies PostItemDto["status"]);
});

test("评论审核通过后，评论应继续保留", async function ({ api, ijiaDbPool }) {
  const { alice, action, post } = await prepareCommentPost(api);
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const c = await action.createComment("需要审核的评论", { token: alice.token });
  const reviewId = await setPostCommentToReviewing(c.id);

  const firstPost = await testGetSelfPost(api, post.id, alice.token);
  expect(firstPost.stat.comment_total).toBe(1);
  let res = await commitReviewNext<PostReviewTarget>(api, { isPass: true, reviewId: reviewId }, Admin.token);
  expect(res.success, "返回成功状态").toBe(true);
  await expect(getCommentReviewStatus(c.id)).resolves.toMatchObject({
    reviewer_id: Admin.id,
    is_review_pass: true,
  } satisfies Partial<CommentReviewStatus>);

  await expect(getCommitList(api, post.id)).resolves.toMatchObject({
    items: { length: 1 },
  });
  const afterPost = await testGetSelfPost(api, post.id, alice.token);
  expect(afterPost.stat.comment_total, "评论计数不变").toBe(1);
});

test("评论审核不通过，直接删除评论", async function ({ api, ijiaDbPool }) {
  const { alice, action, post } = await prepareCommentPost(api);
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const c = await action.createComment("需要审核的评论", { token: alice.token });
  const reviewId = await setPostCommentToReviewing(c.id);

  const firstPost = await testGetSelfPost(api, post.id, alice.token);
  expect(firstPost.stat.comment_total).toBe(1);
  await commitReviewNext<PostReviewTarget>(api, { isPass: false, reviewId: reviewId }, Admin.token);

  await expect(getCommentReviewStatus(c.id)).resolves.toMatchObject({
    reviewer_id: Admin.id,
    is_review_pass: false,
  } satisfies Partial<CommentReviewStatus>);

  await expect(getCommitList(api, post.id), "评论已被删除").resolves.toMatchObject({
    items: { length: 0 },
  });
  const afterPost = await testGetSelfPost(api, post.id, alice.token);
  expect(afterPost.stat.comment_total, "评论计数变化").toBe(0);
});

test("帖子审核通过后，应更新举报用户的审核正确/错误统计", async function ({ api, ijiaDbPool }) {
  const { alice, post } = await preparePost(api);
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });
  const other = await prepareUniqueUser("other");
  const users = await Promise.all(["b1", "b2", "b3"].map((name) => prepareUniqueUser(name)));

  await setPostLike(api, post.id, other.token);
  await Promise.all(users.map((user) => reportPost(api, post.id, user.token)));
  const commitReview = (pass: boolean, pid: number) => {
    return commitReviewNext<PostCommentReviewTarget>(api, { isPass: pass, reviewId: `post-${pid}` }, Admin.token);
  };
  await commitReview(true, post.id);

  const getUserReportStat = () => {
    return select({ user_id: true, report_correct_count: true, report_error_count: true })
      .from(user_profile.name)
      .dataClient(ijiaDbPool)
      .queryMap<number>("user_id")
      .then((res) => Object.fromEntries(res));
  };

  await expect(getUserReportStat()).resolves.toMatchObject({
    [other.id]: { report_correct_count: 0, report_error_count: 0 },
    [users[0].id]: { report_correct_count: 1, report_error_count: 0 },
    [users[1].id]: { report_correct_count: 1, report_error_count: 0 },
    [users[2].id]: { report_correct_count: 1, report_error_count: 0 },
  });

  const p2 = await createPost(api, { content_text: "测试" }, alice.token);
  await setPostLike(api, p2.id, other.token);
  await Promise.all(users.map((user) => reportPost(api, p2.id, user.token)));
  await commitReview(false, p2.id);

  await expect(getUserReportStat()).resolves.toMatchObject({
    [other.id]: { report_correct_count: 0, report_error_count: 0 },
    [users[0].id]: { report_correct_count: 1, report_error_count: 1 },
    [users[1].id]: { report_correct_count: 1, report_error_count: 1 },
    [users[2].id]: { report_correct_count: 1, report_error_count: 1 },
  });
});
test("评论审核通过后，应更新举报用户的审核正确/错误统计", async function ({ api, ijiaDbPool }) {
  const { alice, post, action } = await prepareCommentPost(api);
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });
  const other = await prepareUniqueUser("other");
  const users = await Promise.all(["b1", "b2", "b3"].map((name) => prepareUniqueUser(name)));

  const c1 = await action.createComment("1", { token: alice.token });
  await setCommentLike(api, c1.id, other.token);
  await Promise.all(users.map((user) => reportComment(api, c1.id, undefined, user.token)));
  const commitReview = (pass: boolean, cid: number) => {
    return commitReviewNext<PostCommentReviewTarget>(
      api,
      { isPass: pass, reviewId: `${PostReviewType.postComment}-${cid}` },
      Admin.token,
    );
  };
  await commitReview(true, c1.id);

  const getUserReportStat = () => {
    return select({
      user_id: true,
      report_correct_count: "report_subjective_correct_count",
      report_error_count: "report_subjective_error_count",
    })
      .from(user_profile.name)
      .dataClient(ijiaDbPool)
      .queryMap<number>("user_id")
      .then((res) => Object.fromEntries(res));
  };

  await expect(getUserReportStat()).resolves.toMatchObject({
    [other.id]: { report_correct_count: 0, report_error_count: 0 },
    [users[0].id]: { report_correct_count: 1, report_error_count: 0 },
    [users[1].id]: { report_correct_count: 1, report_error_count: 0 },
    [users[2].id]: { report_correct_count: 1, report_error_count: 0 },
  });

  const c2 = await action.createComment("2", { token: alice.token });
  await setCommentLike(api, c2.id, other.token);
  await Promise.all(users.map((user) => reportComment(api, c2.id, undefined, user.token)));
  await commitReview(false, c2.id);

  await expect(getUserReportStat()).resolves.toMatchObject({
    [other.id]: { report_correct_count: 0, report_error_count: 0 },
    [users[0].id]: { report_correct_count: 1, report_error_count: 1 },
    [users[1].id]: { report_correct_count: 1, report_error_count: 1 },
    [users[2].id]: { report_correct_count: 1, report_error_count: 1 },
  });
});

async function getReviewNext(api: Api, token?: string) {
  return api["/post/review/next"].get({ query: {}, [JWT_TOKEN_KEY]: token });
}
async function commitReviewNext<T>(
  api: Api,
  option: CommitReviewParam & { reviewId: string },
  token?: string,
): Promise<CommitReviewResultDto<T>> {
  const { reviewId, ...rest } = option;
  return api["/post/review/entity/:reviewId/commit"].post({
    params: { reviewId },
    body: rest,
    [JWT_TOKEN_KEY]: token,
  }) as any;
}
async function getCommitList(api: Api, postId: number) {
  return api["/post/content/:postId/comment"].get({ params: { postId: postId } });
}

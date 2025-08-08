import { beforeEach, expect } from "vitest";
import { Api, Context, JWT_TOKEN_KEY, test } from "../../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";

import {
  postReviewController,
  postController,
  commentController,
  PostReviewType,
  PostReviewDto,
  PostReviewTarget,
  CommitReviewParam,
  CommitReviewResultDto,
  PostCommentReviewTarget,
} from "@/modules/post/mod.ts";
import { prepareUniqueUser } from "test/fixtures/user.ts";
import { Role } from "@/global/auth.ts";
import { createPost, getPostReviewStatus, preparePost } from "./utils/prepare_post.ts";
import { setPostCommentToReviewing, setPostToReviewing } from "@/modules/post/sql/report.ts";
import { DeepPartial } from "./utils/comment.ts";
import { CommentReviewStatus, getCommentReviewStatus, prepareCommentPost } from "./utils/prepare_comment.ts";

beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
  applyController(hono, commentController);
  applyController(hono, postReviewController);
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
  const reviewItem = res.next!;
  expect(reviewItem).toMatchObject({
    review_type: PostReviewType.post,

    review_info: null,
    target: { content_text: "测试" },
  } satisfies DeepPartial<PostReviewDto<PostReviewTarget>>);

  const p: CommitReviewParam & { reviewId: string } = { isPass: true, reviewId: reviewItem.review_id };
  await expect(commitReviewNext(api, { ...p, remark: alice.nickname })).responseStatus(401);
  await expect(commitReviewNext(api, { ...p, remark: alice.nickname }, alice.token)).responseStatus(403);
  await expect(commitReviewNext(api, { ...p, remark: Bob.nickname }, Bob.token)).responseStatus(403);

  const review = await commitReviewNext(api, { ...p, remark: Admin.nickname }, Admin.token);

  expect(review).toBeTypeOf("object");
});

test("超级管理员审核帖子", async function ({ api, ijiaDbPool }) {
  const Bob = await prepareUniqueUser("Bob");
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const p1 = await createPost(api, { content_text: "1" }, Bob.token);
  const p2 = await createPost(api, { content_text: "2" }, Bob.token);
  await setPostToReviewing(p1.id);
  await setPostToReviewing(p2.id);

  await expect(api["/post/list"].get(), "获取列表为空").resolves.toMatchObject({
    items: { length: 0 },
  });

  const r1 = await getReviewNext(api, Admin.token);
  expect(r1.next).toBeTypeOf("object");

  const r2 = await commitReviewNext<PostReviewTarget>(api, { isPass: true, reviewId: r1.next!.review_id }, Admin.token);
  {
    expect(r2).toMatchObject({ next: {}, success: true });
    await expect(api["/post/list"].get()).resolves.toMatchObject({
      items: { length: 1 },
    });
    const targetId = r1.next!.target.post_id;
    const status = await getPostReviewStatus(targetId);
    expect(status).toMatchObject({
      is_review_pass: true,
      is_reviewing: false,
      review: {
        is_review_pass: true,
        reviewer_id: Admin.id,
      },
    });
  }

  const r3 = await commitReviewNext<PostReviewTarget>(
    api,
    { isPass: false, reviewId: r2.next!.review_id },
    Admin.token,
  );
  {
    expect(r3.next).toBeUndefined();
    expect(r3).toMatchObject({ success: true });

    await expect(api["/post/list"].get()).resolves.toMatchObject({
      items: { length: 1 },
    });
    const targetId = r2.next!.target.post_id;
    const status = await getPostReviewStatus(targetId);
    expect(status).toMatchObject({
      is_review_pass: false,
      is_reviewing: false,
      review: {
        is_review_pass: false,
        reviewer_id: Admin.id,
      },
    });
  }
});

test("超级管理员审核评论", async function ({ api, ijiaDbPool }) {
  const { alice, action, post } = await prepareCommentPost(api);
  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  const c1 = await action.createComment("1", { token: alice.token });
  const c2 = await action.createComment("2", { token: alice.token });

  await setPostCommentToReviewing(c1.id);
  await setPostCommentToReviewing(c2.id);
  await expect(getCommitList(api, post.id), "获取评论列表为空").resolves.toMatchObject({
    items: { length: 2 },
  });
  const r1 = await getReviewNext(api, Admin.token);
  expect(r1.next).toBeTypeOf("object");

  const r2 = await commitReviewNext<PostCommentReviewTarget>(
    api,
    { isPass: true, reviewId: r1.next!.review_id },
    Admin.token,
  );
  {
    expect(r2).toMatchObject({ next: {}, success: true });
    await expect(getCommitList(api, post.id)).resolves.toMatchObject({
      items: { length: 2 },
    });
    const targetId = r1.next!.target.comment_id;
    const status = await getCommentReviewStatus(targetId);
    expect(status).toMatchObject({
      reviewer_id: Admin.id,
      is_review_pass: true,
    } satisfies Partial<CommentReviewStatus>);
  }

  const r3 = await commitReviewNext(api, { isPass: false, reviewId: r2.next!.review_id }, Admin.token);
  {
    expect(r3.next).toBeUndefined();
    expect(r3).toMatchObject({ success: true });

    await expect(getCommitList(api, post.id)).resolves.toMatchObject({
      items: { length: 1 },
    });
    const targetId = r2.next!.target.comment_id;
    const status = await getCommentReviewStatus(targetId);
    expect(status).toMatchObject({
      reviewer_id: Admin.id,
      is_review_pass: false,
    });
  }
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

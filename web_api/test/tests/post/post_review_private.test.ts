import { beforeEach, expect } from "vitest";
import { Api, Context, test } from "#test/fixtures/hono.ts";
import { postRoutes, reviewRoutes } from "@/routers/mod.ts";

import { CommitReviewParam, CommitReviewResult, ReviewTargetType } from "@/dto.ts";
import { prepareUniqueUser } from "test/fixtures/user.ts";
import { Role } from "@/middleware/auth.ts";
import { createPost, prepareCommentPost } from "#test/utils/post.ts";
import { setPostToReviewing } from "@/routers/review/mod.ts";
import { commitReview, getReviewNext } from "../../utils/review.ts";
import "#test/asserts/post.ts";

beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
  reviewRoutes.apply(hono);
});
test("提交审核后，应返回下一个审核项", async function ({ api, ijiaDbPool }) {
  const { alice, action, post: p0 } = await prepareCommentPost(api);
  const p1 = await createPost(api, { content_text: "1" }, alice.token);
  const p2 = await createPost(api, { content_text: "1" }, alice.token);

  const Admin = await prepareUniqueUser("Admin", { roles: new Set([Role.Admin]) });

  await setPostToReviewing(p0.id);
  await setPostToReviewing(p1.id);
  await setPostToReviewing(p2.id);
  const { count } = await ijiaDbPool.queryFirstRow(`SELECT count(*)::INT FROM review`);
  expect(count).toBe(3);

  const reviewed = new Set();

  const r1 = await getPostReviewNext(api, Admin.token);
  expect(reviewed.has(r1.item?.id)).toBe(false);
  reviewed.add(r1.item?.id);

  const r2 = await commitPostReviewNext(api, { is_passed: true, review_id: r1.item!.id }, Admin.token);
  expect(reviewed.has(r2.next?.id)).toBe(false);
  reviewed.add(r2.next?.id);

  const r3 = await commitPostReviewNext(api, { is_passed: true, review_id: r2.next!.id }, Admin.token);
  expect(reviewed.has(r3.next?.id)).toBe(false);
  reviewed.add(r3.next?.id);

  const r4 = await commitPostReviewNext(api, { is_passed: true, review_id: r3.next!.id }, Admin.token);
  expect(r4.next).toBeUndefined();
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

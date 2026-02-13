import { JWT_TOKEN_KEY, Api } from "#test/fixtures/hono.ts";
import { DbUserProfile } from "@ijia/data/db";

import {
  CreatePostParam,
  PublicPost,
  UpdatePostConfigParam,
  UpdatePostContentParam,
  SelfPost,
  ReviewStatus,
} from "@/dto.ts";
import { dbPool } from "@/db/client.ts";
import { prepareUniqueUser } from "#test/fixtures/user.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { select, update } from "@asla/yoursql";
import { DbQueryPool } from "@asla/pg";

export async function markReviewed(
  postId: number,
  status: {
    reviewing?: boolean;
    review_pass?: boolean | null;
    passCount?: number;
    failCount?: number;
  } = {},
) {
  return dbPool.queryCount(
    update("public.post")
      .set({
        is_reviewing: v(status.reviewing),
        is_review_pass: v(status.review_pass),
      })
      .where([`id=${postId}`]),
  );
}
export type PostReviewInfo = {
  status: ReviewStatus;
  is_review_pass: boolean | null;
  reviewed_time: string | null;
  remark: string | null;
  reviewer_id: number | null;
  review_id: number;
};
export async function getPostReviewStatus(postId: number): Promise<PostReviewInfo | null> {
  const review = await dbPool.queryFirstRow<PostReviewInfo>(
    select({
      status: "p.review_status",
      reviewed_time: "r.resolved_time",
      reviewer_id: "r.reviewer_id",
      is_review_pass: "r.is_passed",
      review_id: "r.id",
      remark: "r.comment",
    })
      .from("public.post", { as: "p" })
      .leftJoin("review", { as: "r", on: "r.id=p.review_id" })
      .where(`p.id=${postId}`),
  );
  return review;
}

export async function createPost(api: Api, body: CreatePostParam, token: string) {
  return api["/post/entity"].put({ body: body, [JWT_TOKEN_KEY]: token });
}

export async function updatePostContentFromApi(
  api: Api,
  postId: number,
  body: Omit<UpdatePostContentParam, "type">,
  token: string,
) {
  return api["/post/entity/:postId"].patch({
    params: { postId },
    body: { ...body, type: "content" },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function updatePostConfigFormApi(
  api: Api,
  postId: number,
  body: Omit<UpdatePostConfigParam, "type">,
  token: string,
) {
  return api["/post/entity/:postId"].patch({
    params: { postId },
    body: { ...body, type: "config" },
    [JWT_TOKEN_KEY]: token,
  });
}

/** 创建一个用户，并发布一个帖子 */
export async function preparePost(api: Api, option?: CreatePostParam) {
  if (!option) option = { content_text: "这是一个测试帖子" };
  const alice = await prepareUniqueUser("alice");
  const post = await createPost(api, option, alice.token);
  return { post, alice };
}

export async function createPostGroup(pool: DbQueryPool, name: string): Promise<number> {
  const result = await pool.queryRows(insertIntoValues("post_group", [{ name: name, public_sort: 0 }]).returning("id"));
  return result[0].id;
}
/** 获取一个指定帖子 */
export async function getPublicPost(api: Api, postId: number, token?: string): Promise<PublicPost> {
  const { items } = await api["/post/list"].get({
    query: { post_id: postId },
    [JWT_TOKEN_KEY]: token,
  });
  return items[0];
}
/** 获取自己的一个指定帖子 */
export async function getSelfPost(api: Api, postId: number, token: string): Promise<SelfPost> {
  const { items } = await api["/post/self/list"].get({
    query: { post_id: postId, number: 1 },
    [JWT_TOKEN_KEY]: token,
  });
  return items[0];
}
export async function deletePost(api: Api, postId: number, token?: string) {
  return api["/post/entity/:postId"].delete({
    params: { postId: postId },
    [JWT_TOKEN_KEY]: token,
  });
}
export function reportPost(api: Api, postId: number, token: string, reason?: string) {
  return api["/post/entity/:postId/report"].post({
    params: { postId: postId },
    body: { reason: reason },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function setPostLike(api: Api, postId: number, token: string) {
  return api["/post/entity/:postId/like"].post({
    params: { postId: postId },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function cancelPostLike(api: Api, postId: number, token: string) {
  return api["/post/entity/:postId/like"].post({
    params: { postId: postId },
    query: { isCancel: true },
    [JWT_TOKEN_KEY]: token,
  });
}

export type UserStat = Pick<
  DbUserProfile,
  | "post_count"
  | "post_like_count"
  | "post_like_get_count"
  | "report_correct_count"
  | "report_error_count"
  | "report_subjective_correct_count"
  | "report_subjective_error_count"
>;
export async function getUserStatFromDb(userId: number): Promise<UserStat> {
  const item = await dbPool.queryFirstRow(
    select({
      post_count: true,
      post_like_count: true,
      post_like_get_count: true,
      report_correct_count: true,
      report_error_count: true,
      report_subjective_correct_count: true,
      report_subjective_error_count: true,
    })
      .from("user_profile")
      .where(`user_id=${v(userId)}`),
  );

  return item as any;
}

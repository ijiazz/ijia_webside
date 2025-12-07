import { JWT_TOKEN_KEY, Api } from "../../../fixtures/hono.ts";
import { DbUserProfile, post, post_group, post_review_info, PostReviewType, user_profile } from "@ijia/data/db";

import {
  CreatePostParam,
  PostItemDto,
  UpdatePostConfigParam,
  UpdatePostContentParam,
  PostReviewInfo,
} from "@/dto/post.ts";
import { dbPool } from "@/db/client.ts";
import { prepareUniqueUser } from "../../../fixtures/user.ts";
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
    update(post.name)
      .set({
        is_reviewing: v(status.reviewing),
        is_review_pass: v(status.review_pass),
      })
      .where([`id=${postId}`]),
  );
}
export async function getPostReviewStatus(postId: number): Promise<ReviewStatus> {
  const t1 = await dbPool.queryFirstRow(
    select<ReviewStatus>({
      is_review_pass: true,
      is_reviewing: true,
      review: select(
        jsonb_build_object({
          is_review_pass: "is_review_pass",
          reviewed_time: "reviewed_time",
          remark: "remark",
          reviewer_id: "reviewer_id",
        }),
      )
        .from(post_review_info.name)
        .where([`type=${v(PostReviewType.post)}`, `target_id=${v(postId)}`])
        .toSelect(),
    })
      .from(post.name)
      .where(`id=${postId}`),
  );

  return t1;
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

export type ReviewStatus = {
  is_review_pass: boolean | null;
  is_reviewing: boolean;
  review: PostReviewInfo | null;
};
/** 创建一个用户，并发布一个帖子 */
export async function preparePost(api: Api, option?: CreatePostParam) {
  if (!option) option = { content_text: "这是一个测试帖子" };
  const alice = await prepareUniqueUser("alice");
  const post = await createPost(api, option, alice.token);
  return { post, alice };
}

export async function createPostGroup(pool: DbQueryPool, name: string): Promise<number> {
  const result = await pool.queryRows(
    insertIntoValues(post_group.name, [{ name: name, public_sort: 0 }]).returning("id"),
  );
  return result[0].id;
}
/** 获取一个指定帖子 */
export async function testGetPost(api: Api, postId: number, token?: string): Promise<PostItemDto> {
  const { items } = await api["/post/list"].get({
    query: { post_id: postId },
    [JWT_TOKEN_KEY]: token,
  });
  return items[0];
}
/** 获取自己的一个指定帖子 */
export async function testGetSelfPost(api: Api, postId: number, token: string): Promise<PostItemDto> {
  const { items } = await api["/post/list"].get({
    query: { post_id: postId, self: true },
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
      .from(user_profile.name)
      .where(`user_id=${v(userId)}`),
  );

  return item as any;
}

import { JWT_TOKEN_KEY, Api } from "../../../fixtures/hono.ts";
import { DbUserProfile, post, post_group, user_profile } from "@ijia/data/db";

import { CreatePostParam, PostItemDto, UpdatePostParam } from "@/modules/post/mod.ts";
import v, { DbPool } from "@ijia/data/yoursql";
import { prepareUniqueUser } from "../../../fixtures/user.ts";

export async function markReviewed(
  postId: number,
  status: {
    reviewing?: boolean;
    review_pass?: boolean | null;
    passCount?: number;
    failCount?: number;
  } = {},
) {
  return post
    .update({
      is_reviewing: v(status.reviewing),
      is_review_pass: v(status.review_pass),
      review_pass_count: v(status.passCount),
      review_fail_count: v(status.failCount),
    })
    .where([`id=${postId}`])
    .queryCount();
}
export async function getPostReviewStatus(postId: number): Promise<ReviewStatus> {
  const select = await post
    .select<ReviewStatus>({
      review_fail_count: true,
      review_pass_count: true,
      is_review_pass: true,
      is_reviewing: true,
    })
    .where(`id=${postId}`)
    .queryFirstRow();

  return select;
}

export async function createPost(api: Api, body: CreatePostParam, token: string) {
  return api["/post/content"].put({ body: body, [JWT_TOKEN_KEY]: token });
}
export async function updatePost(api: Api, postId: number, body: UpdatePostParam, token: string) {
  return api["/post/content/:postId"].patch({
    params: { postId },
    body: body,
    [JWT_TOKEN_KEY]: token,
  });
}
export type ReviewStatus = {
  review_fail_count: number;
  review_pass_count: number;
  is_review_pass: boolean | null;
  is_reviewing: boolean;
};
/** 创建一个用户，并发布一个帖子 */
export async function preparePost(api: Api, option?: CreatePostParam) {
  if (!option) option = { content_text: "这是一个测试帖子" };
  const alice = await prepareUniqueUser("alice");
  const post = await createPost(api, option, alice.token);
  return { post, alice };
}

export async function createPostGroup(pool: DbPool, name: string): Promise<number> {
  const sql = post_group.insert([{ name: name, public_sort: 0 }]).returning("id");
  const result = await pool.queryRows(sql);
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
  return api["/post/content/:postId"].delete({
    params: { postId: postId },
    [JWT_TOKEN_KEY]: token,
  });
}
export function reportPost(api: Api, postId: number, token: string, reason?: string) {
  return api["/post/report/:postId"].post({
    params: { postId: postId },
    body: { reason: reason },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function setPostLike(api: Api, postId: number, token: string) {
  return api["/post/like/:postId"].post({
    params: { postId: postId },
    [JWT_TOKEN_KEY]: token,
  });
}
export async function cancelPostLike(api: Api, postId: number, token: string) {
  return api["/post/like/:postId"].post({
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
  const item = await user_profile
    .select({
      post_count: true,
      post_like_count: true,
      post_like_get_count: true,
      report_correct_count: true,
      report_error_count: true,
      report_subjective_correct_count: true,
      report_subjective_error_count: true,
    })
    .where(`user_id=${v(userId)}`)
    .queryFirstRow();

  return item as any;
}

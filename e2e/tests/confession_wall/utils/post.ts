import { api, JWT_TOKEN_KEY } from "@/__mocks__/fetch.ts";
import { CreatePostParam } from "@api/api.ts";
import { post_group } from "@ijia/data/db";
import { getAppUrlFromRoute } from "@/fixtures/test.ts";
import { dbPool } from "@ijia/data/yoursql";

export async function clearPosts() {
  const res = await dbPool.query("DELETE FROM post");
  return res;
}
export async function clearPostGroup() {
  await post_group.delete().query();
}
export async function createPostGroup(name: string, description?: string) {
  await await post_group
    .insert({ description, name: name })
    .onConflict("id")
    .doUpdate({ name: "'发布分组测试'" })
    .query();
}

export async function createPost(postParam: CreatePostParam, token: string) {
  return api["/post/content"].put({
    body: postParam,
    [JWT_TOKEN_KEY]: token,
  });
}
export async function createCommentUseApi(config: {
  postId: number;
  text: string;
  token?: string;
  replyCommentId?: number;
}) {
  const { postId, text, replyCommentId, token } = config;
  return api["/post/content/:postId/comment"].put({
    params: { postId },
    body: { text, replyCommentId },
    [JWT_TOKEN_KEY]: token,
  });
}

export function gotoComment(postId: number, token?: string) {
  return getAppUrlFromRoute(`/wall/list?openCommentPostId=${postId}`, token);
}

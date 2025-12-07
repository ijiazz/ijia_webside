import { api, JWT_TOKEN_KEY } from "@/__mocks__/fetch.ts";
import { CreatePostParam } from "@api/dto.ts";
import { post_group } from "@ijia/data/db";
import { getAppUrlFromRoute } from "@/fixtures/test.ts";
import { dbPool } from "@ijia/data/dbclient";
import { insertIntoValues } from "@/sql/utils.ts";

export async function clearPosts() {
  const res = await dbPool.query("DELETE FROM post");
  return res;
}
export async function clearPostGroup() {
  await dbPool.query(`DELETE FROM post_group`);
}
export async function createPostGroup(name: string, description?: string) {
  await dbPool.execute(
    insertIntoValues(post_group.name, { description, name: name })
      .onConflict("id")
      .doUpdate({ name: "'发布分组测试'" }),
  );
}

export async function createPost(postParam: CreatePostParam, token: string) {
  return api["/post/entity"].put({
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
  return api["/post/comment/entity"].put({
    body: { text, replyCommentId, postId },
    [JWT_TOKEN_KEY]: token,
  });
}

export function gotoComment(postId: number, token?: string) {
  return getAppUrlFromRoute(`/wall/list?openCommentPostId=${postId}`, token);
}

import { api, JWT_TOKEN_KEY } from "@/utils/fetch.ts";
import { CreatePostParam, GetPostListParam } from "@ijia/api-types";
import { getAppURLFromRoute } from "@/utils/app.ts";
import { dbPool } from "@/db/client.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";

export async function createPostGroup(name: string, description?: string) {
  await dbPool.execute(
    insertIntoValues("post_group", { description, name: name }).onConflict("id").doUpdate({ name: "'发布分组测试'" }),
  );
}
export async function getPublicPost(option: GetPostListParam) {
  return api["/post/list"].get({ query: option });
}
export async function createPost(postParam: CreatePostParam, token: string) {
  const result = await api["/post/entity"].put({
    body: postParam,
    [JWT_TOKEN_KEY]: token,
  });
  const { comment_tree_id } = await dbPool.queryFirstRow<{ comment_tree_id: number }>(
    select("comment_tree_id")
      .from("post")
      .where(`id=${v(result.id)}`),
  );
  return { ...result, comment_tree_id };
}
export async function createCommentUseApi(config: {
  commentTreeId: number | string;
  text: string;
  token?: string;
  replyCommentId?: number | string;
}) {
  const { commentTreeId, text, replyCommentId, token } = config;
  const result = await api["/comment"].put({
    body: {
      text,
      comment_tree_id: commentTreeId.toString(),
      comment_reply_id: replyCommentId?.toString(),
    },
    [JWT_TOKEN_KEY]: token,
  });
  return { id: Number(result.comment_id) };
}

export function getPostListURL() {
  return getAppURLFromRoute("/wall/list");
}

export function getUserPostURL(userId: number, search?: Record<string, any>) {
  return getAppURLFromRoute(`/user/${userId}/post`, search);
}

export function getPostCommentURL(option: { userId: number; postId: number }) {
  const { userId, postId } = option;
  return getAppURLFromRoute(`/user/${userId}/post`, {
    openCommentPostId: postId,
  });
}
export const POST_GROUPS: { id: number; name: string }[] = [
  {
    id: -1,
    name: "分组1",
  },
  {
    id: -2,
    name: "分组2",
  },
];
export const POST_LONG = {
  id: -3,
  name: "较长的分组名字",
};

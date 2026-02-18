import { api, JWT_TOKEN_KEY } from "@/utils/fetch.ts";
import { CreatePostParam, GetPostListParam } from "@api/dto.ts";
import { getAppURLFromRoute } from "@/fixtures/test.ts";
import { dbPool } from "@/db/client.ts";
import { insertIntoValues } from "@/sql/utils.ts";

export async function createPostGroup(name: string, description?: string) {
  await dbPool.execute(
    insertIntoValues("post_group", { description, name: name }).onConflict("id").doUpdate({ name: "'发布分组测试'" }),
  );
}
export async function getPublicPost(option: GetPostListParam) {
  return api["/post/list"].get({ query: option });
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

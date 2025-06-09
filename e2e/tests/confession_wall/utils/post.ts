import { api } from "@/__mocks__/fetch.ts";
import { CreatePostParam } from "@api/api.ts";
import { post, post_group } from "@ijia/data/db";

export async function clearPosts() {
  await post.delete().query();
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
  await api["/post/content"].put({ body: postParam, headers: { cookie: `jwt-token=${token}` } });
}

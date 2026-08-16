import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import { prepareCommentPost, getCommentTotal } from "#test/utils/post.ts";
import { getUserCanCreateCommentLimit } from "@/routers/comment/-sql/comment.sql.ts";
import { afterTime } from "evlib";
import commentRoutes from "@/routers/comment/mod.ts";
import postRoutes from "@/routers/post/mod.ts";
/*
  本测试文件使用了公共数据库 publicDbPool
*/
beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
  commentRoutes.apply(hono);
});

test("评论内容不能超过1000个字符", async function ({ api, publicDbPool }) {
  const { action, alice } = await prepareCommentPost(api);
  const longText = "a".repeat(1001);
  await expect(action.createComment(longText, { token: alice.token })).responseStatus(400);
});

test("每个用户发布评论间隔不能小于2秒", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  await expect(getUserCanCreateCommentLimit(alice.id, 0.2)).resolves.toBe(true);
  await action.createComment("1/1", { token: alice.token });
  await expect(getUserCanCreateCommentLimit(alice.id, 0.2)).resolves.toBe(false);
  await afterTime(200);
  await expect(getUserCanCreateCommentLimit(alice.id, 0.2)).resolves.toBe(true);
});

test("对不存在的评论回复", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  await expect(action.createComment("1", { token: alice.token, replyCommentId: 999999 })).responseStatus(404);
  await expect(getCommentTotal(postInfo.comment_tree_id)).resolves.toBe(0);
});

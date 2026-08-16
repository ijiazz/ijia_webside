import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import { updatePostConfigFormApi, prepareCommentPost, getCommentTotal } from "#test/utils/post.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import commentRoutes from "@/routers/comment/mod.ts";
import postRoutes from "@/routers/post/mod.ts";
import { commitPostReview, setPostToReviewing } from "@/routers/review/mod.ts";
/*
  本测试文件使用了公共数据库 publicDbPool
*/
beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
  commentRoutes.apply(hono);
});

test("审核中的作品不能新增评论和回复评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const root = await action.createComment("1", { token: alice.token });
  await setPostToReviewing(postInfo.id);
  await expect(getCommentTotal(postInfo.comment_tree_id)).resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token })).responseStatus(404);
  await expect(getCommentTotal(postInfo.comment_tree_id), "评论没有新增").resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token, replyCommentId: root.id })).responseStatus(404);
  await expect(getCommentTotal(postInfo.comment_tree_id), "回复评论没有新增").resolves.toBe(1);
});

test("审核不通过的作品不能新增评论和回复评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const root = await action.createComment("1", { token: alice.token });
  const reviewId = await setPostToReviewing(postInfo.id);
  await commitPostReview({ reviewId, isPass: false });

  await expect(getCommentTotal(postInfo.comment_tree_id)).resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token })).responseStatus(404);
  await expect(getCommentTotal(postInfo.comment_tree_id), "评论没有新增").resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token, replyCommentId: root.id })).responseStatus(404);
  await expect(getCommentTotal(postInfo.comment_tree_id), "回复评论没有新增").resolves.toBe(1);
});

test("已隐藏的作品不能新增评论和回复评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const root = await action.createComment("1", { token: alice.token });
  await updatePostConfigFormApi(api, postInfo.id, { is_hide: true }, alice.token);
  await expect(getCommentTotal(postInfo.comment_tree_id)).resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token })).responseStatus(404);
  await expect(getCommentTotal(postInfo.comment_tree_id), "评论没有新增").resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token, replyCommentId: root.id })).responseStatus(404);
  await expect(getCommentTotal(postInfo.comment_tree_id), "回复评论没有新增").resolves.toBe(1);
});

test("已关闭评论的作品只有作者能新增新增评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: post1Info } = await prepareCommentPost(api);
  const bob = await prepareUniqueUser("bob");
  const root = await action.createComment("1", { token: alice.token });
  await updatePostConfigFormApi(api, post1Info.id, { comment_disabled: true }, alice.token);

  await expect(action.createComment("2", { token: bob.token }), "bob 不能创建根评论").responseStatus(404); // 403 更好
  await expect(
    action.createComment("2", { token: bob.token, replyCommentId: root.id }),
    "bob 不能创建回复评论",
  ).responseStatus(404);

  await expect(getCommentTotal(post1Info.comment_tree_id), "回复评论没有新增").resolves.toBe(1);

  await action.createComment("2", { token: alice.token });
  await action.createComment("2", { token: alice.token, replyCommentId: root.id });
  await expect(getCommentTotal(post1Info.comment_tree_id), "回复评论没有新增").resolves.toBe(3);
});

test("帖子作者可以删除别人的评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const bob = await prepareUniqueUser("bob");
  const bobComment = await action.createComment("1", { token: bob.token });
  await action.deleteComment(bobComment.id, { token: alice.token });
  await expect(getCommentTotal(postInfo.comment_tree_id)).resolves.toBe(0);
});

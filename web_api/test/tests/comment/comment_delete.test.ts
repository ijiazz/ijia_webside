import { test, Context } from "../../fixtures/hono.ts";
import { beforeEach, expect } from "vitest";
import { getCommentTotal, prepareCommentPost } from "../../utils/post.ts";
import { prepareUniqueUser } from "../../utils/user.ts";
import commentRoutes from "@/routers/comment/mod.ts";
import postRoutes from "@/routers/post/mod.ts";

beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
  commentRoutes.apply(hono);
});

test("不能删除别人的评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const bob = await prepareUniqueUser("bob");
  const xiaoming = await prepareUniqueUser("xiaoming");

  const bobComment = await action.createComment("1", { token: bob.token });
  const xiaomingComment = await action.createComment("2", { token: xiaoming.token });

  // Bob 尝试删除 xiaoming 的评论
  await expect(action.deleteComment(xiaomingComment.id, { token: bob.token }), "bob 不能删除别人的评论").responseStatus(
    404,
  );
  await expect(action.deleteComment(xiaomingComment.id), "游客不能删除别人的评论").responseStatus(401);
  await action.deleteComment(bobComment.id, { token: bob.token }); // 允许删除自己的评论

  await expect(getCommentTotal(postInfo.comment_tree_id)).resolves.toBe(1);
});
test("帖子作者可以删除别人的评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const bob = await prepareUniqueUser("bob");
  const bobComment = await action.createComment("1", { token: bob.token });
  await action.deleteComment(bobComment.id, { token: alice.token });
  await expect(getCommentTotal(postInfo.comment_tree_id)).resolves.toBe(0);
});

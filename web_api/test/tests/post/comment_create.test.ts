import { applyController } from "@asla/hono-decorator";
import { beforeEach, expect } from "vitest";
import { test, Context, Api } from "../../fixtures/hono.ts";
import { postController } from "@/modules/post/post.controller.ts";
import { commentController } from "@/modules/post/comment.controller.ts";
import { preparePost } from "./utils/prepare_post.ts";
import { prepareUser } from "../../fixtures/user.ts";
import { PostComment } from "./utils/prepare_comment.ts";

beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
  applyController(hono, commentController);
});

test("添加一条根评论", async function ({ api, ijiaDbPool }) {
  const { action, alice } = await prepareCommentPost(api);
  const bob = await prepareUser("bob");
  await action.createComment("作者自己评论", { token: alice.token });
  await action.createComment("用户评论", { token: bob.token });
  await expect(action.createComment("尝试未登录评论")).responseStatus(401);
});
test("回复根评论", async function ({ api, ijiaDbPool }) {
  const { action, alice } = await prepareCommentPost(api);
  const bob = await prepareUser("bob");
  const { id: rootId } = await action.createComment("作者自己评论", { token: alice.token });

  await action.createComment("作者自己回复自己的评论", { token: alice.token, replyCommentId: rootId });
  await action.createComment("bob回复跟评论", { token: bob.token, replyCommentId: rootId });
});
test("回复一楼评论", async function () {});

test("评论内容不能超过500个字符", async function () {});
test("添加评论后，作品的评论数应增加", async function () {});

test("每个用户发布评论间隔不能小于2秒", async function () {});

test("审核中的作品不能新增评论", async function () {});
test("审核不通过的作品不能新增评论", async function () {});
test("已删除的作品不能新增评论", async function () {});
test("已隐藏的作品不能新增评论", async function () {});
test("已关闭评论的作品不能新增评论", async function () {});

async function prepareCommentPost(api: Api) {
  const post1 = await preparePost(api);
  const action = new PostComment(api, post1.post.id);
  return { ...post1, action };
}

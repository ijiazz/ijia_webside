import { applyController } from "@asla/hono-decorator";
import { beforeEach, describe, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import { postController } from "@/modules/post/post.controller.ts";
import { commentController } from "@/modules/post/comment.controller.ts";
import { testGetPost, updatePost, deletePost, preparePost, createPost } from "./utils/prepare_post.ts";
import { prepareUser } from "../../fixtures/user.ts";
import { PostComment, getCommentDbRow, prepareCommentPost, getPostCommentTotal } from "./utils/prepare_comment.ts";
import { PostCommentDto } from "@/modules/post/comment.dto.ts";
import { DbPostComment, post } from "@ijia/data/db";
import { getUserCanCreateCommentLimit } from "@/modules/post/sql/post_comment.ts";
import { afterTime } from "evlib";
import { DeepPartial } from "./utils/comment.ts";

beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
  applyController(hono, commentController);
});

describe("根评论创建", function () {
  test("添加一条根评论", async function ({ api, ijiaDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);
    const bob = await prepareUser("bob");
    await action.createComment("作者自己评论", { token: alice.token });
    await action.createComment("用户评论", { token: bob.token });
    await expect(action.createComment("尝试未登录评论")).responseStatus(401);

    const { items } = await action.getCommentList();
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      content_text: "作者自己评论",
      user: { user_id: alice.id },
    } satisfies DeepPartial<PostCommentDto>);

    expect(items[1]).toMatchObject({
      content_text: "用户评论",
      user: { user_id: bob.id },
    } satisfies DeepPartial<PostCommentDto>);
  });
  test("创建根评论，作品评论计数应该加1", async function ({ api, ijiaDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);
    {
      const post = await testGetPost(api, postInfo.id);
      expect(post.stat.comment_total).toBe(0);
    }

    await action.createComment("1", { token: alice.token });
    {
      const post = await testGetPost(api, postInfo.id);
      expect(post.stat.comment_total).toBe(1);
    }
  });
});

describe("创建回复评论", function () {
  test("回复根评论", async function ({ api, ijiaDbPool }) {
    const { action, alice } = await prepareCommentPost(api);
    const bob = await prepareUser("bob");
    const { id: rootId } = await action.createComment("1", { token: alice.token });

    await action.createComment("alice", { token: alice.token, replyCommentId: rootId });
    await action.createComment("bob", { token: bob.token, replyCommentId: rootId });

    const { items: rooItems } = await action.getCommentList();
    expect(rooItems).toHaveLength(1);
    expect(rooItems[0]).toMatchObject({
      is_root_reply_count: 2,
      reply_count: 2,
    } satisfies Partial<PostCommentDto>);

    const { items } = await action.getReplyList(rootId);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      content_text: "alice",
      user: { user_id: alice.id },
      root_comment_id: rootId,
      reply_to: { user: { user_id: alice.id }, comment_id: rootId },
    } satisfies DeepPartial<PostCommentDto>);

    expect(items[1]).toMatchObject({
      content_text: "bob",
      user: { user_id: bob.id },
      root_comment_id: rootId,
      reply_to: { user: { user_id: alice.id }, comment_id: rootId },
    } satisfies DeepPartial<PostCommentDto>);
  });

  test("回复跟评论，作品评论计数应该加1, 根评论计数加1", async function ({ api, ijiaDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);
    const { id: rootId1 } = await action.createComment("1", { token: alice.token });
    const { id: rootId2 } = await action.createComment("2", { token: alice.token });

    {
      const post = await testGetPost(api, postInfo.id);
      expect(post.stat.comment_total, "作品评论为1").toBe(2);
    }

    await action.createComment("1-1", { token: alice.token, replyCommentId: rootId1 });

    {
      const post = await testGetPost(api, postInfo.id);
      expect(post.stat.comment_total, "作品评论为1").toBe(3);
      await expect(getCommentDbRow(rootId1)).resolves.toMatchObject({
        is_root_reply_count: 1,
        reply_count: 1,
      } satisfies DeepPartial<DbPostComment>);
    }

    await action.createComment("1-2", { token: alice.token, replyCommentId: rootId1 });

    {
      const post = await testGetPost(api, postInfo.id);
      expect(post.stat.comment_total, "作品评论为3").toBe(4);
      await expect(getCommentDbRow(rootId1)).resolves.toMatchObject({
        is_root_reply_count: 2,
        reply_count: 2,
      } satisfies DeepPartial<DbPostComment>);
    }

    await expect(getCommentDbRow(rootId2), "其他评论计数不受影响").resolves.toMatchObject({
      is_root_reply_count: 0,
      reply_count: 0,
    } satisfies DeepPartial<DbPostComment>);
  });

  test("回复跟评论下的评论，作品评论计数应该加1，跟评论计数加1", async function ({ api, ijiaDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);
    const { id: rootId1 } = await action.createComment("1", { token: alice.token });
    const { id: rootId2 } = await action.createComment("2", { token: alice.token });

    const lv1_1 = await action.createComment("1-1", { token: alice.token, replyCommentId: rootId1 });
    const lv1_2 = await action.createComment("1-2", { token: alice.token, replyCommentId: rootId2 });

    {
      const post = await testGetPost(api, postInfo.id);
      expect(post.stat.comment_total, "作品评论为4").toBe(4);

      await expect(getCommentDbRow(rootId1)).resolves.toMatchObject({
        is_root_reply_count: 1,
        reply_count: 1,
      } satisfies DeepPartial<DbPostComment>);
      await expect(getCommentDbRow(rootId2)).resolves.toMatchObject({
        is_root_reply_count: 1,
        reply_count: 1,
      } satisfies DeepPartial<DbPostComment>);

      await expect(getCommentDbRow(lv1_1.id)).resolves.toMatchObject({
        is_root_reply_count: 0,
        reply_count: 0,
      } satisfies DeepPartial<DbPostComment>);
    }

    {
      await action.createComment("1-1-1", { token: alice.token, replyCommentId: lv1_1.id });
      const post = await testGetPost(api, postInfo.id);
      expect(post.stat.comment_total, "作品评论+1").toBe(5);

      await expect(getCommentDbRow(rootId1)).resolves.toMatchObject({
        is_root_reply_count: 2,
        reply_count: 1,
      } satisfies DeepPartial<DbPostComment>);
      await expect(getCommentDbRow(rootId2)).resolves.toMatchObject({
        is_root_reply_count: 1,
        reply_count: 1,
      } satisfies DeepPartial<DbPostComment>);
      await expect(getCommentDbRow(lv1_1.id)).resolves.toMatchObject({
        is_root_reply_count: 0,
        reply_count: 1,
      } satisfies DeepPartial<DbPostComment>);
    }
  });

  test("回复一楼评论", async function ({ api, ijiaDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);

    const { id: rootId1 } = await action.createComment("1", { token: alice.token });
    const { id: rootId2 } = await action.createComment("2", { token: alice.token });

    const lv1_1 = await action.createComment("1-1", { token: alice.token, replyCommentId: rootId1 });
    const lv2_1 = await action.createComment("2-1", { token: alice.token, replyCommentId: rootId2 });

    await action.createComment("1-1-1", { token: alice.token, replyCommentId: lv1_1.id });
    await action.createComment("1-1-2", { token: alice.token, replyCommentId: lv1_1.id });

    await action.createComment("2-1-1", { token: alice.token, replyCommentId: lv2_1.id });

    const { items: rooItems } = await action.getCommentList();
    expect(rooItems).toHaveLength(2);
    expect(rooItems[0].is_root_reply_count, "跟评论1总共有3条回复").toBe(3);
    expect(rooItems[1].is_root_reply_count, "跟评论2总共有2条回复").toBe(2);

    const { items } = await action.getReplyList(rootId1);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ content_text: "1-1" } satisfies Partial<PostCommentDto>);
    expect(items[1]).toMatchObject({
      content_text: "1-1-1",
      root_comment_id: rootId1,
      reply_to: { comment_id: lv1_1.id },
    } satisfies DeepPartial<PostCommentDto>);
    expect(items[2]).toMatchObject({
      content_text: "1-1-2",
      root_comment_id: rootId1,
      reply_to: { comment_id: lv1_1.id },
    } satisfies DeepPartial<PostCommentDto>);

    const post = await testGetPost(api, postInfo.id);
    expect(post.stat.comment_total).toBe(7);
  });
});

test("评论内容不能超过1000个字符", async function ({ api, ijiaDbPool }) {
  const { action, alice } = await prepareCommentPost(api);
  const longText = "a".repeat(1001);
  await expect(action.createComment(longText, { token: alice.token })).responseStatus(400);
});

test("每个用户发布评论间隔不能小于2秒", async function ({ api, ijiaDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  await expect(getUserCanCreateCommentLimit(alice.id, 0.2)).resolves.toBe(true);
  await action.createComment("1/1", { token: alice.token });
  await expect(getUserCanCreateCommentLimit(alice.id, 0.2)).resolves.toBe(false);
  await afterTime(200);
  await expect(getUserCanCreateCommentLimit(alice.id, 0.2)).resolves.toBe(true);
});

test("对不存在作品创建评论", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");
  const action = new PostComment(api, 999999);
  await expect(action.createComment("1", { token: alice.token })).responseStatus(404);
});
test("对不存在的评论回复", async function ({ api, ijiaDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  await expect(action.createComment("1", { token: alice.token, replyCommentId: 999999 })).responseStatus(404);
  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(0);
});

test("审核中的作品不能新增评论和回复评论", async function ({ api, ijiaDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const root = await action.createComment("1", { token: alice.token });
  await post.update({ is_reviewing: "true" }).where(`id=${postInfo.id}`).query();
  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token })).responseStatus(404);
  await expect(getPostCommentTotal(postInfo.id), "评论没有新增").resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token, replyCommentId: root.id })).responseStatus(404);
  await expect(getPostCommentTotal(postInfo.id), "回复评论没有新增").resolves.toBe(1);
});

test("审核不通过的作品不能新增评论和回复评论", async function ({ api, ijiaDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const root = await action.createComment("1", { token: alice.token });
  await post.update({ is_review_pass: "false" }).where(`id=${postInfo.id}`).query();
  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token })).responseStatus(404);
  await expect(getPostCommentTotal(postInfo.id), "评论没有新增").resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token, replyCommentId: root.id })).responseStatus(404);
  await expect(getPostCommentTotal(postInfo.id), "回复评论没有新增").resolves.toBe(1);
});
test("已删除的作品不能新增评论和回复评论", async function ({ api, ijiaDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const root = await action.createComment("1", { token: alice.token });
  await deletePost(api, postInfo.id, alice.token);
  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token })).responseStatus(404);
  await expect(getPostCommentTotal(postInfo.id), "评论没有新增").resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token, replyCommentId: root.id })).responseStatus(404);
  await expect(getPostCommentTotal(postInfo.id), "回复评论没有新增").resolves.toBe(1);
});
test("已隐藏的作品不能新增评论和回复评论", async function ({ api, ijiaDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const root = await action.createComment("1", { token: alice.token });
  await updatePost(api, postInfo.id, { is_hide: true }, alice.token);
  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token })).responseStatus(404);
  await expect(getPostCommentTotal(postInfo.id), "评论没有新增").resolves.toBe(1);

  await expect(action.createComment("2", { token: alice.token, replyCommentId: root.id })).responseStatus(404);
  await expect(getPostCommentTotal(postInfo.id), "回复评论没有新增").resolves.toBe(1);
});

test("已关闭评论的作品只有作者能新增新增评论", async function ({ api, ijiaDbPool }) {
  const { action, alice, post: post1Info } = await prepareCommentPost(api);
  const bob = await prepareUser("bob");
  const root = await action.createComment("1", { token: alice.token });
  await updatePost(api, post1Info.id, { comment_disabled: true }, alice.token);

  await expect(action.createComment("2", { token: bob.token }), "bob 不能创建根评论").responseStatus(404); // 403 更好
  await expect(
    action.createComment("2", { token: bob.token, replyCommentId: root.id }),
    "bob 不能创建回复评论",
  ).responseStatus(404);

  await expect(getPostCommentTotal(post1Info.id), "回复评论没有新增").resolves.toBe(1);

  await action.createComment("2", { token: alice.token });
  await action.createComment("2", { token: alice.token, replyCommentId: root.id });
  await expect(getPostCommentTotal(post1Info.id), "回复评论没有新增").resolves.toBe(3);
});

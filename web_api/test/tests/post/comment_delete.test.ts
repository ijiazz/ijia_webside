import { test, Context } from "../../fixtures/hono.ts";
import { beforeEach, describe, expect } from "vitest";
import { getCommentDbRow, getPostCommentTotal, prepareCommentPost } from "../../utils/post.ts";
import { prepareUniqueUser } from "../../fixtures/user.ts";
import { DbPostComment } from "@ijia/data/db";
import { recursiveDeleteComment } from "@/routers/post/comment/-sql/post_comment.sql.ts";
import commentRoutes from "@/routers/post/comment/mod.ts";
import postRoutes from "@/routers/post/mod.ts";

beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
  commentRoutes.apply(hono);
});

test("删除叶子评论，作品评论数应减 1", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const root = await action.createComment("1", { token: alice.token });
  const reply = await action.createComment("2", { token: alice.token, replyCommentId: root.id });
  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(2);

  await action.deleteComment(reply.id, { token: alice.token });
  await expect(getPostCommentTotal(postInfo.id), "作品评论数减1").resolves.toBe(1);
  await expect(getCommentDbRow(root.id)).resolves.toMatchObject({
    reply_count: 0,
    is_root_reply_count: 0,
  } satisfies Partial<DbPostComment>);

  await action.deleteComment(root.id, { token: alice.token });
  await expect(getPostCommentTotal(postInfo.id), "作品评论数减1").resolves.toBe(0);
});

test("删除根评论，作品评论应减去跟评论总回复数，再获取评论列表应不包含根跟评论", async function ({
  api,
  publicDbPool,
}) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);

  const r0 = await action.createComment("0", { token: alice.token });
  await action.createComment("0-1", { token: alice.token, replyCommentId: r0.id });

  const root = await action.createComment("1", { token: alice.token }); //delete
  await action.createComment("1-1", { token: alice.token, replyCommentId: root.id });
  await action.createComment("1-2", { token: alice.token, replyCommentId: root.id });

  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(5);

  await action.deleteComment(root.id, { token: alice.token });
  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(2);
  const list = await action.getCommentList().then((r) => r.items.map((item) => item.content_text));
  expect(list).toEqual(["0"]);
});

test("删除一级评论，根评论回复数应减1，作品评论数应减 1", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);

  await action.createComment("1", { token: alice.token });
  const root = await action.createComment("2", { token: alice.token });
  const r1_1 = await action.createComment("2-1", { token: alice.token, replyCommentId: root.id });
  const r1_2 = await action.createComment("2-2", { token: alice.token, replyCommentId: root.id }); //delete。 r1_r2_1 仍然显示
  const r1_2_1 = await action.createComment("2-2-1", { token: alice.token, replyCommentId: r1_2.id });

  await expect(getCommentDbRow(root.id)).resolves.toMatchObject({
    reply_count: 2,
    is_root_reply_count: 3,
  } satisfies Partial<DbPostComment>);
  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(5);

  await action.deleteComment(r1_2.id, { token: alice.token });

  await expect(getPostCommentTotal(postInfo.id), "作品评论数减 1").resolves.toBe(4);
  await expect(getCommentDbRow(root.id), "根评论回复数减少").resolves.toMatchObject({
    reply_count: 1,
    is_root_reply_count: 2,
  } satisfies Partial<DbPostComment>);
});

test("删除二级评论，父级评论和根评论计数相应减少", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);

  await action.createComment("2", { token: alice.token });
  const root = await action.createComment("1", { token: alice.token });
  const r1_1 = await action.createComment("1-1", { token: alice.token, replyCommentId: root.id });
  const r1_1_1 = await action.createComment("1-1-1", { token: alice.token, replyCommentId: r1_1.id }); //delete

  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(4);

  await action.deleteComment(r1_1_1.id, { token: alice.token });

  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(3);
  await expect(getCommentDbRow(root.id)).resolves.toMatchObject({
    reply_count: 1,
    is_root_reply_count: 1,
  } satisfies Partial<DbPostComment>);
});

test("先删除父级评论，再删除子评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);

  await action.createComment("2", { token: alice.token });
  const root = await action.createComment("1", { token: alice.token });
  const r1_1 = await action.createComment("1-1", { token: alice.token, replyCommentId: root.id }); //delete
  const r1_2 = await action.createComment("1-1-1", { token: alice.token, replyCommentId: r1_1.id });

  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(4);

  await action.deleteComment(r1_1.id, { token: alice.token });

  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(3);
  await expect(getCommentDbRow(root.id)).resolves.toMatchObject({
    reply_count: 0,
    is_root_reply_count: 1,
  } satisfies Partial<DbPostComment>);

  await action.deleteComment(r1_2.id, { token: alice.token });
  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(2);
  await expect(getCommentDbRow(root.id)).resolves.toMatchObject({
    reply_count: 0,
    is_root_reply_count: 0,
  } satisfies Partial<DbPostComment>);
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

  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(1);
});
test("帖子作者可以删除别人的评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const bob = await prepareUniqueUser("bob");
  const bobComment = await action.createComment("1", { token: bob.token });
  await action.deleteComment(bobComment.id, { token: alice.token });
  await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(0);
});

describe("递归删除", function () {
  test("删除根评论，根评论的所有子评论都会被删除", async function ({ api, publicDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);
    const root = await action.createComment("1", { token: alice.token }); //delete
    const reply = await action.createComment("1-1", { token: alice.token, replyCommentId: root.id });
    const lv2 = await action.createComment("1-1-1", { token: alice.token, replyCommentId: reply.id });

    await recursiveDeleteComment(root.id, alice.id);

    await expect(getCommentDbRow(reply.id), "根评论回复数和总回复数").resolves.toMatchObject({
      is_delete: true,
    } satisfies Partial<DbPostComment>);
    await expect(getCommentDbRow(lv2.id), "根评论回复数和总回复数").resolves.toMatchObject({
      is_delete: true,
    } satisfies Partial<DbPostComment>);
  });
  test("删除一级评论后，一级评论的子评论也会被删除", async function ({ api, publicDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);
    const root = await action.createComment("1", { token: alice.token });
    const reply = await action.createComment("1-1", { token: alice.token, replyCommentId: root.id }); //delete
    const lv2 = await action.createComment("1-1-1", { token: alice.token, replyCommentId: reply.id });
    const lv3 = await action.createComment("1-1-1", { token: alice.token, replyCommentId: lv2.id });

    await recursiveDeleteComment(reply.id, alice.id);

    await expect(getCommentDbRow(lv2.id), "根评论回复数和总回复数").resolves.toMatchObject({
      is_delete: true,
    } satisfies Partial<DbPostComment>);
    await expect(getCommentDbRow(lv3.id), "根评论回复数和总回复数").resolves.toMatchObject({
      is_delete: true,
    } satisfies Partial<DbPostComment>);
  });
  test("删除一级评论，帖子评论数、父级评论回复数、跟评论回复数相应减少", async function ({ api, publicDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);

    await action.createComment("0", { token: alice.token });
    const root = await action.createComment("1", { token: alice.token });
    const r1_1 = await action.createComment("1-1", { token: alice.token, replyCommentId: root.id });
    const r1_2 = await action.createComment("1-2", { token: alice.token, replyCommentId: root.id }); //delete
    const r1_2_1 = await action.createComment("1-2-1", { token: alice.token, replyCommentId: r1_2.id });
    const r1_2_2 = await action.createComment("1-2-2", { token: alice.token, replyCommentId: r1_2.id });
    const r1_2_2_1 = await action.createComment("1-2-2-1", { token: alice.token, replyCommentId: r1_2_2.id });

    await expect(getCommentDbRow(root.id), "回复数和根评论总回复数").resolves.toMatchObject({
      reply_count: 2,
      is_root_reply_count: 5,
    } satisfies Partial<DbPostComment>);
    await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(7);

    await recursiveDeleteComment(r1_2.id, alice.id);

    await expect(getCommentDbRow(root.id), "回复数和根评论总回复数-1").resolves.toMatchObject({
      reply_count: 1,
      is_root_reply_count: 1,
    } satisfies Partial<DbPostComment>);
    await expect(getPostCommentTotal(postInfo.id), "作品评论数更新为 2").resolves.toBe(3);
  });
  test("先删除部分子评论，再删除一级评论，再删除根评论", async function ({ api, publicDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);

    const r0 = await action.createComment("0", { token: alice.token });
    const root = await action.createComment("1", { token: alice.token }); //delete last
    const r1_1 = await action.createComment("1-1", { token: alice.token, replyCommentId: root.id });
    const r1_2 = await action.createComment("1-2", { token: alice.token, replyCommentId: root.id }); //delete second
    const r1_3 = await action.createComment("1-3", { token: alice.token, replyCommentId: root.id });

    const r1_2_1 = await action.createComment("1-2-1", { token: alice.token, replyCommentId: r1_2.id }); //delete first
    const r1_2_1_1 = await action.createComment("1-2-1-1", { token: alice.token, replyCommentId: r1_2_1.id });

    await expect(getCommentDbRow(root.id), "回复数和根评论总回复数").resolves.toMatchObject({
      reply_count: 3,
      is_root_reply_count: 5,
    } satisfies Partial<DbPostComment>);
    await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(7);

    await recursiveDeleteComment(r1_2_1.id, alice.id);
    await expect(getCommentDbRow(root.id)).resolves.toMatchObject({
      reply_count: 3,
      is_root_reply_count: 3,
    } satisfies Partial<DbPostComment>);

    await recursiveDeleteComment(r1_2.id, alice.id);
    await expect(getCommentDbRow(root.id)).resolves.toMatchObject({
      reply_count: 2,
      is_root_reply_count: 2,
    } satisfies Partial<DbPostComment>);

    await recursiveDeleteComment(root.id, alice.id);
    await expect(getCommentDbRow(root.id)).resolves.toMatchObject({
      reply_count: 0,
      is_root_reply_count: 0,
    } satisfies Partial<DbPostComment>);
    await expect(getPostCommentTotal(postInfo.id)).resolves.toBe(1);

    await expect(getCommentDbRow(r1_2_1_1.id)).resolves.toMatchObject({
      reply_count: 0,
      is_root_reply_count: 0,
    } satisfies Partial<DbPostComment>);
    await expect(getCommentDbRow(r0.id), "不应影响到 r0").resolves.toMatchObject({
      reply_count: 0,
      is_root_reply_count: 0,
    } satisfies Partial<DbPostComment>);
  });
});

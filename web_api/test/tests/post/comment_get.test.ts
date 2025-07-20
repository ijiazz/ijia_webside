import { commentController, PostCommentDto, postController } from "@/modules/post/mod.ts";
import { applyController } from "@asla/hono-decorator";
import { beforeEach, describe, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import { prepareCommentPost, prepareCommentToDb } from "./utils/prepare_comment.ts";
import { updatePost, deletePost } from "./utils/prepare_post.ts";
import { post } from "@ijia/data/db";
import { DeepPartial } from "./utils/comment.ts";
import { prepareUniqueUser } from "../..//fixtures/user.ts";

beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
  applyController(hono, commentController);
});

test("分页获取根评论列表", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const g1 = await initCommentTree(action.postId, alice.id, { start: 0, count: 5, textPrefix: "root-" });
  const g2 = await initCommentTree(action.postId, alice.id, { start: 5, count: 5, textPrefix: "root-" }); // 分开创建，错开时间
  await initCommentTree(action.postId, alice.id, {
    count: 2,
    textPrefix: "root-1-",
    replyId: g1[0],
  }); // 随便插入一些子评论

  const num = 4;
  const r1 = await action.getCommentList({ number: num });
  expect(r1.items.length).toBe(num);
  expect(r1.has_more).toBe(true);
  expect(r1.items[0].content_text).toBe("root-0");
  expect(r1.items[3].content_text).toBe("root-3");

  const r2 = await action.getCommentList({ number: num, cursor: r1.next_cursor! });
  expect(r2.items.length).toBe(num);
  expect(r2.has_more).toBe(true);
  expect(r2.items[0].content_text).toBe("root-4");
  expect(r2.items[3].content_text).toBe("root-7");

  const r3 = await action.getCommentList({ number: num, cursor: r2.next_cursor! });
  expect(r3.items.length).toBe(2);
  expect(r3.has_more).toBe(false);
  expect(r3.items[0].content_text).toBe("root-8");
  expect(r3.items[1].content_text).toBe("root-9");
});
test("获取评论回复的平铺列表", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const g1 = await initCommentTree(action.postId, alice.id, { count: 2, textPrefix: "root-" });
  const g1_1 = await initCommentTree(action.postId, alice.id, {
    count: 3,
    textPrefix: "1-",
    replyId: g1[0],
  });

  const g1_2 = await initCommentTree(action.postId, alice.id, {
    count: 2,
    textPrefix: "1-",
    replyId: g1[1],
  });
  const g1_2_1 = await initCommentTree(action.postId, alice.id, {
    count: 2,
    textPrefix: "1-2-",
    replyId: g1_2[0],
  });

  const list = await action.getReplyList(g1[0]);
  expect(list.items.length).toBe(3);
  expect(list.items.map((c) => c.content_text)).toEqual(["1-0", "1-1", "1-2"]);

  {
    const list2 = await action.getReplyList(g1[1]);
    expect(list2.items.length).toBe(4);
    expect(list2.items.map((c) => c.content_text)).toEqual(["1-0", "1-1", "1-2-0", "1-2-1"]);

    // 分页获取评论回复列表
    const list0 = await action.getReplyList(g1[1], { number: 3 });
    expect(list0.items.length).toBe(3);
    expect(list0.items.map((c) => c.content_text)).toEqual(["1-0", "1-1", "1-2-0"]);
    expect(list0.has_more).toBe(true);

    const list1 = await action.getReplyList(g1[1], { number: 2, cursor: list0.next_cursor! });
    expect(list1.items.length).toBe(1);
    expect(list1.items.map((c) => c.content_text)).toEqual(["1-2-1"]);
    expect(list1.has_more).toBe(false);
  }
});

test("评论列表不能包含已删除的评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const g1 = await initCommentTree(action.postId, alice.id, { count: 3, textPrefix: "root-" });
  const children = await initCommentTree(action.postId, alice.id, {
    count: 2,
    textPrefix: "1-",
    replyId: g1[0],
  }); // 随便插入一些子评论

  // 删除第一个评论
  await action.deleteComment(g1[1], { token: alice.token });
  await action.deleteComment(children[0], { token: alice.token }); // 删除一个子评论

  const r2 = await action.getCommentList();
  expect(r2.items.map((c) => c.content_text)).toEqual(["root-0", "root-2"]);

  const r3 = await action.getReplyList(g1[0]);
  expect(r3.items.map((c) => c.content_text)).toEqual(["1-1"]);
});

test("能够获取回复已删除的评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const root = await action.createComment("1", { token: alice.token }); // 创建一个评论
  const reply = await action.createComment("1-1", {
    token: alice.token,
    replyCommentId: root.id,
  }); // 创建一个回复评论
  const reply2 = await action.createComment("1-1-1", {
    token: alice.token,
    replyCommentId: reply.id,
  }); // 创建一个回复评论

  await action.deleteComment(reply.id, { token: alice.token }); // 删除回复评论
  const commentList = await action.getReplyList(root.id);

  expect(commentList.items).toHaveLength(1);
  expect(commentList.items[0]).toMatchObject({
    comment_id: reply2.id,
    reply_to: { is_deleted: true, comment_id: reply.id },
  } satisfies DeepPartial<PostCommentDto>);
});

test("获取指定 ID 的评论", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const g1 = await initCommentTree(action.postId, alice.id, { start: 0, count: 3, textPrefix: "root-" });
  const reply = await initCommentTree(action.postId, alice.id, {
    count: 2,
    textPrefix: "1-",
    replyId: g1[0],
  });
  const rootList = await action.getCommentList({ commentId: g1[1] });
  expect(rootList.items).toHaveLength(1);
  expect(rootList.items[0].content_text).toBe("root-1");

  const replyList = await action.getReplyList(g1[0], { commentId: reply[1] });
  expect(replyList.items).toHaveLength(1);
  expect(replyList.items[0].content_text).toBe("1-1");
});
test("帖子作者可以看到所有人的删除按钮，其他人只能看到自己的删除按钮", async function ({ api, publicDbPool }) {
  const { action, alice, post: postInfo } = await prepareCommentPost(api);
  const bob = await prepareUniqueUser("bob"); // 创建一个用户

  await action.createComment("bob-comment", { token: bob.token });
  await action.createComment("alice-comment", { token: alice.token });

  const aliceList = await action.getCommentList({}, alice.token);
  const bobList = await action.getCommentList(undefined, bob.token);
  const visitorList = await action.getCommentList();

  expect(bobList.items.map((c) => c.curr_user?.can_update)).toEqual([true, false]);
  expect(aliceList.items.map((c) => c.curr_user?.can_update)).toEqual([true, true]);
  expect(visitorList.items.map((c) => c.curr_user)).toEqual([null, null]);
});
describe("部分帖子状态下不能获取评论", () => {
  test("不能获取正在审核的作品的评论", async function ({ api, publicDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);
    await action.createComment("1", { token: alice.token }); // 创建一个评论

    await post.update({ is_reviewing: "true" }).where(`id=${action.postId}`).query(); // 设置作品为审核中

    const authorGet = await action.getCommentList(undefined, alice.token);
    await expect(authorGet.items.length).toBe(1);
    await expect(action.getCommentList()).resolves.toMatchObject({ items: [] });
  });
  test("不能获取审核不通过的作品的评论", async function ({ api, publicDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);
    await action.createComment("1", { token: alice.token }); // 创建一个评论

    await post.update({ is_review_pass: "false" }).where(`id=${postInfo.id}`).query(); // 设置作品为审核不通过

    const authorGet = await action.getCommentList(undefined, alice.token);
    await expect(authorGet.items.length).toBe(1);
    await expect(action.getCommentList()).resolves.toMatchObject({ items: [] });
  });

  test("不能获取已隐藏的作品的评论", async function ({ api, publicDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);
    await action.createComment("1", { token: alice.token }); // 创建一个评论
    await updatePost(api, postInfo.id, { is_hide: true }, alice.token); // 隐藏作品

    const authorGet = await action.getCommentList(undefined, alice.token);
    await expect(authorGet.items.length).toBe(1);
    await expect(action.getCommentList()).resolves.toMatchObject({ items: [] });
  });
  test("不能获取已删除的作品的评论", async function ({ api, publicDbPool }) {
    const { action, alice, post: postInfo } = await prepareCommentPost(api);
    await action.createComment("1", { token: alice.token }); // 创建一个评论
    await deletePost(api, postInfo.id, alice.token);

    await expect(action.getCommentList(undefined, alice.token)).resolves.toMatchObject({ items: [] });
    await expect(action.getCommentList()).resolves.toMatchObject({ items: [] });
  });
});

async function initCommentTree(
  postId: number,
  userId: number,
  config: {
    start?: number;
    count: number;
    textPrefix?: string;
    replyId?: number;
  },
) {
  const { replyId, textPrefix = "" } = config;
  let i = config.start ?? 0;
  const max = config.count + i;
  const result: number[] = [];
  for (; i < max; i++) {
    const text = textPrefix + i.toString();

    const [res] = await prepareCommentToDb(postId, userId, [{ text, replyCommentId: replyId }]);
    result.push(res.id);
  }
  return result;
}

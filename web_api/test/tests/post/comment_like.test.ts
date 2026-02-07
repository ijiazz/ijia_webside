import { beforeEach, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import {
  getCommentStat,
  prepareCommentPost,
  setCommentLike,
  CommentInfo,
  cancelCommentLike,
} from "../../utils/post.ts";
import { prepareUniqueUser } from "test/fixtures/user.ts";
import commentRoutes from "@/routers/post/comment/mod.ts";
import postRoutes from "@/routers/post/mod.ts";

beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
  commentRoutes.apply(hono);
});

test("点赞评论，评论计数应加1, 取消应减1", async function ({ api, publicDbPool }) {
  const { alice, post, action } = await prepareCommentPost(api);

  const comment = await action.createComment("a", { token: alice.token });

  await setCommentLike(api, comment.id, alice.token);

  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 1,
  } satisfies Partial<CommentInfo>);

  await cancelCommentLike(api, comment.id, alice.token);
  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 0,
  } satisfies Partial<CommentInfo>);
});
test("重复点赞评论或重复取消点赞，将忽略，评论计数不变", async function ({ api, publicDbPool }) {
  const { alice, post, action } = await prepareCommentPost(api);

  const comment = await action.createComment("a", { token: alice.token });

  {
    const { success } = await setCommentLike(api, comment.id, alice.token);
    await expect(success).toBe(true);

    await expect(getCommentStat(comment.id)).resolves.toMatchObject({
      like_count: 1,
    } satisfies Partial<CommentInfo>);
  }
  {
    const { success } = await setCommentLike(api, comment.id, alice.token);
    await expect(success).toBe(false);

    await expect(getCommentStat(comment.id)).resolves.toMatchObject({
      like_count: 1,
    } satisfies Partial<CommentInfo>);
  }
  {
    const { success } = await cancelCommentLike(api, comment.id, alice.token);
    await expect(success).toBe(true);

    await expect(getCommentStat(comment.id)).resolves.toMatchObject({
      like_count: 0,
    } satisfies Partial<CommentInfo>);
  }
  {
    const { success } = await cancelCommentLike(api, comment.id, alice.token);
    await expect(success).toBe(false);

    await expect(getCommentStat(comment.id)).resolves.toMatchObject({
      like_count: 0,
    } satisfies Partial<CommentInfo>);
  }
});

test("已删除的评论不能点赞", async function ({ api, publicDbPool }) {
  const { alice, post, action } = await prepareCommentPost(api);

  const comment = await action.createComment("a", { token: alice.token });
  await action.deleteComment(comment.id, { token: alice.token });

  await expect(setCommentLike(api, comment.id, alice.token)).resolves.toMatchObject({ success: false });

  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 0,
  } satisfies Partial<CommentInfo>);
});

test("已删除的评论可以取消点赞", async function ({ api, publicDbPool }) {
  const { alice, post, action } = await prepareCommentPost(api);
  const bob = await prepareUniqueUser("bob");
  const comment = await action.createComment("a", { token: alice.token });
  await setCommentLike(api, comment.id, alice.token);
  await setCommentLike(api, comment.id, bob.token);

  await action.deleteComment(comment.id, { token: alice.token });

  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 2,
  } satisfies Partial<CommentInfo>);

  await cancelCommentLike(api, comment.id, bob.token);

  await expect(getCommentStat(comment.id)).resolves.toMatchObject({
    like_count: 1,
  } satisfies Partial<CommentInfo>);
});

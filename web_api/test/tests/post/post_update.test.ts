import { beforeEach, describe, expect } from "vitest";
import { Context, test } from "../../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";
import { post, TextStructureType } from "@ijia/data/db";

import { postController } from "@/modules/post/mod.ts";
import { prepareUniqueUser } from "test/fixtures/user.ts";
import { createPostGroup, testGetPost, testGetSelfPost } from "./utils/prepare_post.ts";
import { getPostReviewStatus, markReviewed, preparePost, ReviewStatus, updatePost } from "./utils/prepare_post.ts";
import v from "@ijia/data/yoursql";

beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
});

test("更新自己的发布的帖子的内容", async function ({ api, publicDbPool }) {
  const { post, alice } = await preparePost(api);
  const base = await testGetPost(api, post.id);

  await updatePost(api, post.id, { content_text: "更新" }, alice.token);
  const postInfo = await testGetPost(api, post.id);
  expect(postInfo.content_text, "帖子内容应该被正确更新").toBe("更新");
  expect(postInfo.update_time, "时间应该被更新").not.toEqual(base.update_time);
});
test("更新文本时应替换文本结构", async function ({ api, publicDbPool }) {
  const { alice, post } = await preparePost(api, {
    content_text: "这是一个测试帖子",
    content_text_structure: [{ index: 0, length: 1, type: TextStructureType.user, user_id: "1" }],
  });

  await updatePost(api, post.id, { content_text: "1" }, alice.token);

  const postInfo = await testGetPost(api, post.id);
  expect(postInfo.content_text, "帖子内容应该被正确更新").toBe("1");
  expect(postInfo.content_text_structure, "帖子文本结构应该被清空").toBe(null);
});
test("更新自己的发布的帖子的可见状态", async function ({ api, publicDbPool }) {
  const { post, alice } = await preparePost(api, { content_text: "12" });
  const base = await testGetPost(api, post.id, alice.token);

  await updatePost(api, post.id, { is_hide: true }, alice.token);
  await expect(testGetPost(api, post.id), "帖子应该对访客不可见").resolves.toBe(undefined);

  const aliceView = await testGetSelfPost(api, post.id, alice.token);
  expect(aliceView.config.self_visible, "帖子应该对自己可见").toBeTruthy();
  expect(aliceView.update_time, "时间不应该被更新").toEqual(base.update_time);
  expect(aliceView.content_text).toBe("12");
});

test("不能更新别人发布的帖子的内容或可见状态", async function ({ api, publicDbPool }) {
  const { post, alice } = await preparePost(api);
  const bob = await prepareUniqueUser("bob");

  await expect(updatePost(api, post.id, { content_text: "2" }, bob.token), "应拒绝更新别人的帖子").responseStatus(404);
});

test("更新的内容不能超过5000个字符", async function ({ api, publicDbPool }) {
  const { post, alice } = await preparePost(api);

  const p = updatePost(api, post.id, { content_text: "a".repeat(5001) }, alice.token);
  await expect(p, "更新的内容超过5000个字符应该被拒绝").responseStatus(400);
});
test.todo("更新的图片不能超过9张", async function ({ api, publicDbPool }) {});

test.todo("更新的图片不能超过每张10M", async function ({ api, publicDbPool }) {});

describe("更新已审核通过的帖子", async function () {
  test("选择了分组的帖子，更新内容后应清除旧的审核数据并更改审核状态为审核中", async function ({ api, publicDbPool }) {
    const group = await createPostGroup(publicDbPool, "测试分组");
    const { post: freePost, alice } = await preparePost(api, { group_id: group, content_text: "1" });
    await markReviewed(freePost.id, { review_pass: true, reviewing: false, passCount: 3, failCount: 1 });
    // freePost 为审核通过，且不在审核中

    await updatePost(api, freePost.id, { content_text: "更新" }, alice.token);

    const postInfo = await getPostReviewStatus(freePost.id);
    expect(postInfo, "审核中、未有结果、审核计数为0").toMatchObject({
      is_review_pass: null, // 未有审核结果
      is_reviewing: true, // 审核中
      review_fail_count: 0,
      review_pass_count: 0,
    } satisfies Partial<ReviewStatus>);
  });
  test("未选择分组的帖子，更新内容后应清除旧的审核数据", async function ({ api, publicDbPool }) {
    const { post: reviewedPost, alice } = await preparePost(api, { content_text: "已审核" });

    // 更新已有审核已通过且不在审核中的帖子
    await markReviewed(reviewedPost.id, { review_pass: true, reviewing: false, passCount: 3, failCount: 1 });

    await updatePost(api, reviewedPost.id, { content_text: "更新" }, alice.token);
    const postInfo = await getPostReviewStatus(reviewedPost.id);
    expect(postInfo, "不在审核、未有结果、审核计数为0").toMatchObject({
      is_review_pass: null, // 未有审核结果
      is_reviewing: false,
      review_fail_count: 0,
      review_pass_count: 0,
    } satisfies Partial<ReviewStatus>);
  });
});

test("审核中的帖子，更新内容后审核状态不变，审核数据重置", async function ({ api, publicDbPool }) {
  const { post: freePost, alice } = await preparePost(api, { content_text: "1" });
  await markReviewed(freePost.id, { review_pass: null, reviewing: true, passCount: 3, failCount: 1 });

  await updatePost(api, freePost.id, { content_text: "更新" }, alice.token);

  const postInfo = await getPostReviewStatus(freePost.id);
  expect(postInfo, "审核中、未有结果、审核计数为0").toMatchObject({
    is_review_pass: null, // 未有审核结果
    is_reviewing: true,
    review_fail_count: 0,
    review_pass_count: 0,
  } satisfies Partial<ReviewStatus>);
});

test("更新审核不通过的帖子，审核状态和审核数据不变", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const result = await post
    .insert([
      {
        content_text: "未审核",
        review_fail_count: 0,
        review_pass_count: 0,
        is_review_pass: null,
        is_reviewing: false,
        user_id: alice.id,
      },
      {
        content_text: "审核不通过",
        review_fail_count: 3,
        review_pass_count: 1,
        is_review_pass: false,
        is_reviewing: false,
        user_id: alice.id,
      },
    ])
    .returning(["id", "review_fail_count", "review_pass_count", "is_review_pass", "is_reviewing"])
    .queryMap<number>("id");

  const keys = Array.from(result.keys());
  await Promise.all(keys.map((id) => updatePost(api, id, { content_text: "更新" }, alice.token)));

  const status = await post
    .select<ReviewStatus & { id: number }>({
      id: true,
      review_fail_count: true,
      review_pass_count: true,
      is_review_pass: true,
      is_reviewing: true,
    })
    .where(`user_id=${v(alice.id)}`)
    .queryMap<string>("id");

  expect(Object.fromEntries(status), "审核数据未改变").toEqual(Object.fromEntries(result));
});
test("只更新帖子的隐藏状态，审核状态和审核数据不变", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const result = await post
    .insert([
      {
        content_text: "未审核",
        review_fail_count: 0,
        review_pass_count: 0,
        is_review_pass: null,
        is_reviewing: false,
        user_id: alice.id,
      },
      {
        content_text: "审核中",
        review_fail_count: 0,
        review_pass_count: 0,
        is_review_pass: null,
        is_reviewing: true,
        user_id: alice.id,
      },
      {
        content_text: "审核不通过",
        review_fail_count: 3,
        review_pass_count: 1,
        is_review_pass: false,
        is_reviewing: false,
        user_id: alice.id,
      },
      {
        content_text: "审核通过",
        review_fail_count: 1,
        review_pass_count: 3,
        is_review_pass: true,
        is_reviewing: false,
        user_id: alice.id,
      },
    ])
    .returning(["id", "review_fail_count", "review_pass_count", "is_review_pass", "is_reviewing"])
    .queryMap<number>("id");

  const keys = Array.from(result.keys());
  await Promise.all(keys.map((id) => updatePost(api, id, { is_hide: true }, alice.token)));

  const status = await post
    .select<ReviewStatus & { id: number }>({
      id: true,
      review_fail_count: true,
      review_pass_count: true,
      is_review_pass: true,
      is_reviewing: true,
    })
    .where(`user_id=${v(alice.id)}`)
    .queryMap<string>("id");

  expect(Object.fromEntries(status), "审核数据未改变").toEqual(Object.fromEntries(result));
});

test("更新帖子的评论关闭状态", async function ({ api, publicDbPool }) {
  const { post: postInfo, alice } = await preparePost(api);
  const bob = await prepareUniqueUser("bob");

  {
    await updatePost(api, postInfo.id, { comment_disabled: true }, alice.token);

    const bobGet = await testGetPost(api, postInfo.id, bob.token);
    expect(bobGet.curr_user?.can_comment).toBe(false);
    expect(bobGet.config.comment_disabled).toBe(true);
  }
  {
    await updatePost(api, postInfo.id, { comment_disabled: false }, alice.token);
    const bobGet = await testGetPost(api, postInfo.id, bob.token);
    expect(bobGet.curr_user?.can_comment).toBe(true);
    expect(bobGet.config.comment_disabled).toBe(false);
  }
});

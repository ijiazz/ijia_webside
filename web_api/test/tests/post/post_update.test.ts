import { beforeEach, describe, expect } from "vitest";
import { Context, test } from "../../fixtures/hono.ts";
import { ReviewStatus, TextStructureType } from "@ijia/data/db";

import { prepareUniqueUser } from "test/fixtures/user.ts";
import {
  createPost,
  createPostGroup,
  PostReviewInfo,
  getPublicPost,
  getSelfPost,
  updatePostConfigFormApi,
  updatePostContentFromApi,
} from "../../utils/post.ts";
import { getPostReviewStatus, preparePost } from "../../utils/post.ts";
import { DeepPartial } from "../../utils/common.ts";
import postRoutes from "@/routers/post/mod.ts";
import {} from "@/dto.ts";
import { commitPostReview, setPostToReviewing } from "@/routers/review/mod.ts";
import "#test/asserts/post.ts";

beforeEach<Context>(async ({ hono }) => {
  postRoutes.apply(hono);
});

test("更新自己的发布的帖子的内容", async function ({ api, publicDbPool }) {
  const { post, alice } = await preparePost(api);
  const base = await getPublicPost(api, post.id);

  await updatePostContentFromApi(api, post.id, { content_text: "更新" }, alice.token);
  const postInfo = await getPublicPost(api, post.id);
  expect(postInfo.content_text, "帖子内容应该被正确更新").toBe("更新");
  expect(postInfo.update_time, "时间应该被更新").not.toEqual(base.update_time);
});
test("更新文本时应替换文本结构", async function ({ api, publicDbPool }) {
  const { alice, post } = await preparePost(api, {
    content_text: "这是一个测试帖子",
    content_text_structure: [{ index: 0, length: 1, type: TextStructureType.user, user_id: "1" }],
  });

  await updatePostContentFromApi(api, post.id, { content_text: "1" }, alice.token);

  const postInfo = await getPublicPost(api, post.id);
  expect(postInfo.content_text, "帖子内容应该被正确更新").toBe("1");
  expect(postInfo.content_text_structure, "帖子文本结构应该被清空").toBe(null);
});
test("更新自己的发布的帖子的可见状态", async function ({ api, publicDbPool }) {
  const { post, alice } = await preparePost(api, { content_text: "12" });
  const base = await getPublicPost(api, post.id, alice.token);

  await updatePostConfigFormApi(api, post.id, { is_hide: true }, alice.token);
  await expect(getPublicPost(api, post.id), "帖子应该对访客不可见").resolves.toBe(undefined);

  const aliceView = await getSelfPost(api, post.id, alice.token);
  expect(aliceView.config?.self_visible, "帖子应该对自己可见").toBeTruthy();
  expect(aliceView.update_time, "时间不应该被更新").toEqual(base.update_time);
  expect(aliceView.content_text).toBe("12");
});

test("不能更新别人发布的帖子的内容或可见状态", async function ({ api, publicDbPool }) {
  const { post, alice } = await preparePost(api);
  const bob = await prepareUniqueUser("bob");

  await expect(
    updatePostContentFromApi(api, post.id, { content_text: "2" }, bob.token),
    "应拒绝更新别人的帖子",
  ).responseStatus(404);
});

test("更新的内容不能超过5000个字符", async function ({ api, publicDbPool }) {
  const { post, alice } = await preparePost(api);

  const p = updatePostContentFromApi(api, post.id, { content_text: "a".repeat(5001) }, alice.token);
  await expect(p, "更新的内容超过5000个字符应该被拒绝").responseStatus(400);
});
test.todo("更新的图片不能超过9张", async function ({ api, publicDbPool }) {});

test.todo("更新的图片不能超过每张10M", async function ({ api, publicDbPool }) {});

describe("更新已审核通过的帖子", async function () {
  test("选择了分组的帖子，更新内容后应清除旧的审核数据并更改审核状态为审核中", async function ({ api, publicDbPool }) {
    const group = await createPostGroup(publicDbPool, "测试分组");
    const { post: freePost, alice } = await preparePost(api, { group_id: group, content_text: "1" });
    const reviewId = await setPostToReviewing(freePost.id); // 设置为审核中
    await commitPostReview({ reviewId, isPass: true }); // 设置审核通过
    // freePost 为审核通过，且不在审核中

    await updatePostContentFromApi(api, freePost.id, { content_text: "更新" }, alice.token);

    await expect(freePost.id).postReviewStatusIs(ReviewStatus.pending);
    const postInfo = await getPostReviewStatus(freePost.id);
    expect(postInfo, "无审核数据").toMatchObject({
      is_review_pass: null, // 未有审核结果
      remark: null,
      reviewed_time: null,
    } satisfies DeepPartial<PostReviewInfo>);
  });
  test("未选择分组的帖子，更新内容后应清除旧的审核数据", async function ({ api, publicDbPool }) {
    const { post: reviewedPost, alice } = await preparePost(api, { content_text: "已审核" });

    const reviewId = await setPostToReviewing(reviewedPost.id); // 设置为审核中
    // 更新已有审核已通过且不在审核中的帖子
    await commitPostReview({ reviewId, isPass: true });

    await updatePostContentFromApi(api, reviewedPost.id, { content_text: "更新" }, alice.token);
    await expect(reviewedPost.id).postReviewStatusIs(null);
  });
});

test("审核中的帖子，更新内容后仍为审核中，审核数据重置", async function ({ api, publicDbPool }) {
  // 不一定需要选择分组。可能是因为举报触发的审核
  const { post: freePost, alice } = await preparePost(api, { content_text: "1" });

  await setPostToReviewing(freePost.id); // 设置为审核中

  await updatePostContentFromApi(api, freePost.id, { content_text: "更新" }, alice.token);

  await expect(freePost.id, "应为审核中").postReviewStatusIs(ReviewStatus.pending);
  const postInfo = await getPostReviewStatus(freePost.id);
  expect(postInfo, "未审核，审核计数为0").toMatchObject({
    is_review_pass: null,
    remark: null,
    reviewed_time: null,
  } satisfies DeepPartial<PostReviewInfo>);
});

test("更新审核不通过的帖子，审核数据重置", async function ({ api, publicDbPool }) {
  const groupId = await createPostGroup(publicDbPool, "测试分组");
  const alice = await prepareUniqueUser("alice");

  const p1 = await createPost(api, { content_text: "未审核", group_id: groupId }, alice.token);

  const p2 = await createPost(api, { content_text: "审核不通过" }, alice.token);
  const reviewId = await setPostToReviewing(p2.id); // 设置为审核中
  await commitPostReview({ reviewId, isPass: false }); // 设置审核不通过

  await Promise.all([p1, p2].map(({ id }) => updatePostContentFromApi(api, id, { content_text: "更新" }, alice.token)));

  {
    await expect(p1.id, "选择了分组，则审核状态变为审核中").postReviewStatusIs(ReviewStatus.pending);
    const info = await getPostReviewStatus(p1.id);
    expect(info, "未审核，审核计数为0").toMatchObject({ is_review_pass: null } satisfies DeepPartial<PostReviewInfo>);
  }
  await expect(p2.id, "未选择选择了分组，则审核状态清除").postReviewStatusIs(ReviewStatus.pending);
});

test("更新帖子的评论关闭状态", async function ({ api, publicDbPool }) {
  const { post: postInfo, alice } = await preparePost(api);
  const bob = await prepareUniqueUser("bob");

  {
    await updatePostConfigFormApi(api, postInfo.id, { comment_disabled: true }, alice.token);

    const bobGet = await getPublicPost(api, postInfo.id, bob.token);
    expect(bobGet.curr_user?.can_comment).toBe(false);
  }
  {
    await updatePostConfigFormApi(api, postInfo.id, { comment_disabled: false }, alice.token);
    const selfGet = await getSelfPost(api, postInfo.id, alice.token);
    expect(selfGet.curr_user?.can_comment).toBe(true);
    expect(selfGet.config?.comment_disabled).toBe(false);
  }
});
test("更新帖子的评论关闭状态, 不应影响可见配置", async function ({ api, publicDbPool }) {
  const { post: postInfo, alice } = await preparePost(api, { is_hide: true, content_text: "1" });

  const bobGet = await getSelfPost(api, postInfo.id, alice.token);
  expect(bobGet.config?.comment_disabled).toBe(false);
  expect(bobGet.config?.self_visible).toBe(true);

  {
    await updatePostConfigFormApi(api, postInfo.id, { comment_disabled: true }, alice.token);

    const bobGet = await getSelfPost(api, postInfo.id, alice.token);
    expect(bobGet.config?.self_visible).toBe(true);
    expect(bobGet.config?.comment_disabled).toBe(true);
  }
  {
    await updatePostConfigFormApi(api, postInfo.id, { comment_disabled: false }, alice.token);
    const bobGet = await getSelfPost(api, postInfo.id, alice.token);
    expect(bobGet.config?.self_visible).toBe(true);
    expect(bobGet.config?.comment_disabled).toBe(false);
  }
});

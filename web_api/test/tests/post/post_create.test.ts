import { beforeEach, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";
import { post, post_review_info, TextStructure, TextStructureType, TextStructureUser } from "@ijia/data/db";

import { postController } from "@/modules/post/mod.ts";
import { prepareUniqueUser } from "../../fixtures/user.ts";
import { PostItemDto } from "@/api.ts";
import { createPostGroup, testGetPost } from "./utils/prepare_post.ts";
import { createPost } from "./utils/prepare_post.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";

beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
});

test("发布一条帖子", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const post = await createPost(api, { content_text: "你好" }, alice.token);

  const item = await testGetPost(api, post.id);
  expect(item.author!.user_id).toBe(alice.id.toString());
  expect(item.stat).toMatchObject({
    comment_total: 0,
    like_total: 0,
  } satisfies Partial<PostItemDto["stat"]>);
  expect(item.content_text).toBe("你好");
  expect(item.create_time, "创建即发布").toEqual(item.publish_time);
});
test("文本结构需要正确传递和保存", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const create = (content: string, struct: TextStructure[]) => {
    return createPost(api, { content_text: content, content_text_structure: struct }, alice.token);
  };
  {
    const res = create("你好", {
      type: TextStructureType.user,
      user_id: "1",
      index: 1,
      length: 2,
    } satisfies TextStructureUser as any);
    await expect(res, "只能保存数组结构").responseStatus(400);
  }

  {
    const res = await create("你好123", [
      { type: TextStructureType.user, user_id: "1", index: 1, length: 2, abcd: "11" },
    ] satisfies TextStructureUser[]);
    const item = await testGetPost(api, res.id, alice.token);
    expect(item.content_text_structure, "不应保存多余的字段").toEqual([
      { type: TextStructureType.user, user_id: "1", index: 1, length: 2 },
    ]);
  }
  {
    const res = create("你好", [
      { type: TextStructureType.user, user_id: "1", index: 1, length: 2 },
      { type: TextStructureType.user, user_id: "1", index: 1, length: 2 }, // 重复的结构
    ] satisfies TextStructureUser[]);
    await expect(res, "不允许传递不正确的顺序").responseStatus(400);
  }
  {
    const res = create("你好", [
      { type: TextStructureType.user, user_id: "1", index: 10, length: 2 },
    ] satisfies TextStructureUser[]);
    await expect(res, "不允许传递超过范围的结构").responseStatus(400);
  }
});
test("发布时选择分组，不允许选择仅自己可见", async function () {});

test("发布帖子，如果选择了分组，发布后将直接进入审核状态", async function ({ publicDbPool, api }) {
  const alice = await prepareUniqueUser("alice");
  const groupId = await createPostGroup(publicDbPool, "test1");

  const { id } = await createPost(api, { content_text: "test1分组", group_id: groupId }, alice.token);

  const info = await select({ is_reviewing: true, create_time: true, publish_time: true })
    .from(post.name)
    .where(`id = ${v(id)}`)
    .dataClient(publicDbPool)
    .queryFirstRow();

  expect(info.is_reviewing).toBe(true);
  expect(info.create_time).not.toBe(null);
  expect(info.publish_time).toBe(null);

  const reviewQueue = await select({ target_id: true })
    .from(post_review_info.name)
    .where(`type='post' AND target_id=${v(id)}`)
    .dataClient(publicDbPool)
    .queryFirstRow();
  expect(reviewQueue).not.toBeNull();
});
test("发布的文本限制5000个字符", async function ({ publicDbPool, api }) {
  const alice = await prepareUniqueUser("alice");
  // 发布超长文本
  const send = (len: number) => {
    return createPost(api, { content_text: "a".repeat(len) }, alice.token);
  };
  await expect(send(5001)).responseStatus(400);
  await send(5000);
});
test.todo("发布的图片限制每张图片不超过10M", async function () {});
test.todo("发布的图片限制9张", async function () {});
test("每个用户每天限制发帖子数量为50", async function ({ publicDbPool, api }) {
  const alice = await prepareUniqueUser("postCreateLimitTest");
  const send = (i: number) => createPost(api, { content_text: `第${i + 1}条帖子` }, alice.token);

  for (let i = 0; i < 50; i++) {
    await send(i);
  }
  await expect(send(50)).responseStatus(403);
});

test("发布帖子关闭评论区", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const postInfo = await createPost(api, { content_text: "test1分组", comment_disabled: true }, alice.token);

  {
    const item = await testGetPost(api, postInfo.id, alice.token);
    expect(item.config.comment_disabled).toBe(true);
    expect(item.curr_user?.can_comment).toBe(true);
  }
  {
    const item = await testGetPost(api, postInfo.id, bob.token);
    expect(item.config.comment_disabled).toBe(true);
    expect(item.curr_user?.can_comment).toBe(false);
  }
});

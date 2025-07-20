import { beforeEach, expect } from "vitest";
import { Context, test } from "../../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";
import { post } from "@ijia/data/db";

import { postController } from "@/modules/post/mod.ts";
import { prepareUser } from "test/fixtures/user.ts";
import { ReviewStatus, updatePost } from "./utils/prepare_post.ts";

beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
});

test("更新审核不通过的帖子，审核状态和审核数据不变", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");
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
    .queryMap<string>("id");

  expect(Object.fromEntries(status), "审核数据未改变").toEqual(Object.fromEntries(result));
});
test("只更新帖子的隐藏状态，审核状态和审核数据不变", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");
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
    .queryMap<string>("id");

  expect(Object.fromEntries(status), "审核数据未改变").toEqual(Object.fromEntries(result));
});

import { beforeEach, describe, expect } from "vitest";
import { Context, JWT_TOKEN_KEY, Api, test } from "../../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";
import { post } from "@ijia/data/db";

import { CreatePostParam, postController } from "@/modules/post/mod.ts";
import { prepareUser } from "test/fixtures/user.ts";
import { createPostGroup, preparePost, testGetPost } from "./utils/prepare_post.ts";
import v from "@ijia/data/yoursql";

beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
});
test.todo("有两名审核全部审核通过后，帖子将通过审核", async function () {});
test.todo("有两名审核全部审核不通过后，帖子将审核不通过", async function () {});
test.todo("有一名审核通过，一名审核不通过，帖子将需要超级管理员审核", async function () {});

test.todo("超级管理员审核通过后，帖子将通过审核", async function () {});
test.todo("超级管理员审核不通过后，帖子将审核不通过", async function () {});

test.todo("审核通过后，删除举报记录", async function () {});

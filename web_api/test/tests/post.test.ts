import { expect, beforeEach } from "vitest";
import { test, Context } from "../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";

import { postController } from "@/modules/post/post.controller.ts";

beforeEach<Context>(async ({ hono, hoFetch, ijiaDbPool }) => {
  applyController(hono, postController);
});

test.todo("没有登录只能查看前 10 条", async function ({ api }) {});
test.todo("只能查看 god 用户发布的帖子", async function ({ api }) {});
test.todo("遵循各个平台的可见时间范围", async function ({ api }) {});

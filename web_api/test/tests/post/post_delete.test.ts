import { beforeEach, expect } from "vitest";
import { test, Context, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";
import { applyController } from "@asla/hono-decorator";

import { postController } from "@/modules/post/mod.ts";
import { prepareUser } from "../../fixtures/user.ts";
beforeEach<Context>(async ({ hono }) => {
  applyController(hono, postController);
});

test("帖子删除后不能再获取", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");
  const { id } = await api["/post/content"].put({ body: { content_text: "test1分组" }, [JWT_TOKEN_KEY]: alice.token });
  await api["/post/content/:postId"].delete({ params: { postId: id }, [JWT_TOKEN_KEY]: alice.token });
  const { items: aliceList } = await api["/post/list"].get({ [JWT_TOKEN_KEY]: alice.token });

  expect(aliceList.length, "删除后，列表中不再包含该帖子").toBe(0);

  const p = api["/post/content/:postId"].delete({ params: { postId: id }, [JWT_TOKEN_KEY]: alice.token });
  await expect(p, "再次删除已删除的帖子，应该返回404").responseStatus(404);
});
test("不能删除别人的帖子", async function ({ api, ijiaDbPool }) {
  const alice = await prepareUser("alice");
  const bob = await prepareUser("bob");
  const { id } = await api["/post/content"].put({ body: { content_text: "test1分组" }, [JWT_TOKEN_KEY]: alice.token });

  const deleteResult = api["/post/content/:postId"].delete({ params: { postId: id }, [JWT_TOKEN_KEY]: bob.token });
  await expect(deleteResult, "尝试删除别人的帖子，删除失败").responseStatus(404);

  await expect(
    api["/post/content/:postId"].delete({ params: { postId: id } }),
    "未登录，尝试删除别人的帖子，删除失败",
  ).responseStatus(401);
});

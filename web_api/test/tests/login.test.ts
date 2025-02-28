import { expect, beforeEach } from "vitest";
import { test, Context } from "../fixtures/hono.ts";
import { LoginType, userController } from "@/modules/user/mod.ts";
import { applyController } from "@/hono-decorator/src/apply.ts";
beforeEach<Context>(({ hono }) => {
  applyController(hono, userController);
});

test.todo("创建用户", async function ({ api }) {
  // api["/user/self/profile"].post({ body: { email: "" } });
});
test("邮箱或学号不存在，应返回提示", async function ({ api }) {
  const result = await api["/user/login"].post({
    body: { id: "2022", method: LoginType.id, password: "", passwordNoHash: true },
    ifFailed: "throw-parse",
  });
  expect(result.success).toBeFalsy();
  expect(result.message).toBeTypeOf("string");
});
test.todo("密码错误，应返回提示", async function ({ hono }) {});

import { expect, beforeAll } from "vitest";
import { test, Context } from "../fixtures/hono.ts";

test("邮箱或学号不存在，应返回提示", async function ({ api }) {
  const result = await api["/user/login"].post({
    body: { id: "abc", method: "id", password: "", passwordNoHash: true },
  });
  expect(result.success).toBeFalsy();
  expect(result.message).toBeTypeOf("string");
});
test.todo("密码错误，应返回提示", async function ({ hono }) {});

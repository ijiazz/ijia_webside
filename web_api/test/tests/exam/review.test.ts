import { test, Context, Api, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";

test("只有 Admin 角色可以获取审核题目和提交审核", async function ({ api, publicDbPool }) {});
test("获取审核题目项", async function ({ api, publicDbPool }) {});
test("审核通过", async function ({ api, publicDbPool }) {});
test("审核不通过，并给出评论", async function ({ api, publicDbPool }) {});
test("审核通过，并更新题目信息", async function ({ api, publicDbPool }) {});

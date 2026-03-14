import { test, Context, Api, JWT_TOKEN_KEY } from "../../fixtures/hono.ts";

test("普通用户出题后，题目应该处于待审核状态", async function ({ api }) {});

test("创建题目后，应更新用户总题数", async function ({ api }) {});

test("修改题目后，题目应该处于待审核状态，且修改的信息不应提交", async function ({ api }) {});

test("删除题目后，题目将归属于系统，并更新用户总题数", async function ({ api }) {});

test("可以或获取自己的审核不通过、和审核中的题目列表", async function ({ api }) {});
test("可以或获取自己的审核通过的题目列表", async function ({ api }) {});

test("获取别人的题目列表，应只能获取审核通过的", async function ({ api }) {});

test("未登录不能获取用户的题目列表", async function ({ api }) {});

test("登录后可以查看题目统计", async function ({ api }) {});

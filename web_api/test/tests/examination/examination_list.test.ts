import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import { createPracticeExamination, listExamination } from "#test/utils/examination.ts";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
});

test("获取自己的考试列表时，只返回自己的考试", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");

  await createPracticeExamination(api, alice.token, { question_total: 0 });
  await createPracticeExamination(api, alice.token, { question_total: 0 });
  await createPracticeExamination(api, bob.token, { question_total: 0 });

  const list = await listExamination(api, alice.token);
  expect(list.items).toHaveLength(2);
  expect(list.items.every((item) => item.title === "模拟考试")).toBe(true);
});

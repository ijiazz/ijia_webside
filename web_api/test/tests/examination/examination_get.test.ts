import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import { createPracticeExamination, getExamination } from "#test/utils/examination.ts";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
});

test("可以获取自己的考试信息", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 0 });

  const detail = await getExamination(api, alice.token, examination_id);
  expect(detail).toMatchObject({
    id: examination_id,
    title: "模拟考试",
  });
});

test("获取他人的考试信息应返回 404", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 0 });

  await expect(getExamination(api, bob.token, examination_id)).responseStatus(404);
});

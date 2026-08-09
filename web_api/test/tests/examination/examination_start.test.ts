import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import testExaminationRoutes from "@/routers/test/examination.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  createPracticeExamination,
  getExaminationRealQuestionTotal,
  startExamination,
} from "#test/utils/examination.ts";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
  testExaminationRoutes.apply(hono);
});

test("开始模拟考试时，会生成模板题绑定并初始化首题作答记录", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const { examination_id } = await createPracticeExamination(alice.token, { question_total: 2 });

  await expect(getExaminationRealQuestionTotal(+examination_id)).resolves.toBe(0);

  await startExamination(alice.token, examination_id);

  await expect(getExaminationRealQuestionTotal(+examination_id)).resolves.toBe(2);
});

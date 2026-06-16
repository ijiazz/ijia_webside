import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  createPracticeExamination,
  prepareExamination,
  getExaminationRecord,
  prepareExaminationTemplate,
} from "#test/utils/examination.ts";
import { v } from "@/sql/utils.ts";
import { dbPool } from "@/db/client.ts";
import { ExamPlan } from "#test/utils/examination/ExamPlan.ts";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
});

test("交卷前，查看作答记录应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 0 });

  await expect(getExaminationRecord(api, alice.token, examination_id)).responseStatus(409);
});

test("结果开放前，查看考试记录不展示正确答案；开放后可查看结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate();
  const examination_id = await prepareExamination({ userId: alice.id, templateId });
  const plan = new ExamPlan(api, alice.token, examination_id);

  await setResultAllowViewDate(examination_id, new Date(Date.now() + 1000 * 60 * 60));
  await plan.start();
  await plan.commitGetNext([1]);
  await plan.end();

  const recordBefore = await plan.getRecord();
  expect(recordBefore.questions[0].question?.answer).toBeUndefined();

  await setResultAllowViewDate(examination_id, new Date(Date.now() - 1000 * 60 * 60));

  const result = await plan.getResult();
  expect(result).toMatchObject({ grade: 1, correct_number: 1, wrong_number: 0, unanswered_number: 0 });
  const recordAfter = await plan.getRecord();
  expect(recordAfter.questions[0].question?.answer?.answer_index).toEqual([1]);
});

test.todo("成绩统计完成前，查看考试接口应返回空，在统计完成后，才能查看考试结果");
async function setResultAllowViewDate(examId: number, date: Date) {
  await dbPool.execute(v.gen`
    UPDATE examination
    SET result_allow_view_date = ${date}
    WHERE id=${examId}
  `);
}

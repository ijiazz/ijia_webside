import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  createPracticeExamination,
  DEFAULT_QUESTIONS,
  ExamPlan,
  getExamination,
  getExaminationRecord,
  prepareExamination,
  prepareExaminationTemplate,
} from "#test/utils/examination.ts";
import { dbPool } from "@/db/client.ts";
import { v } from "@/sql/utils.ts";

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

test("交卷前，查看作答记录应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 0 });

  await expect(getExaminationRecord(api, alice.token, examination_id)).responseStatus(409);
});

test("结果开放前，查看考试记录不展示正确答案；开放后可查看结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS);
  const examination_id = await prepareExamination({
    userId: alice.id,
    templateId,
    resultAllowViewDate: new Date(Date.now() + 6000),
  });
  const plan = new ExamPlan(api, alice.token, examination_id);

  await plan.start();
  await plan.commitGetNext([1]);
  await plan.end();

  const recordBefore = await plan.getRecord();
  expect(recordBefore.questions[0].question?.answer).toBeUndefined();

  await setResultAllowViewDate(examination_id, new Date(Date.now() - 1000));

  const recordAfter = await plan.getRecord();
  expect(recordAfter.questions[0].question?.answer?.answer_index).toEqual([0]);
});

async function setResultAllowViewDate(examId: number, date: Date) {
  await dbPool.execute(v.gen`
    UPDATE examination
    SET result_allow_view_date = ${date}
    WHERE id=${examId}
  `);
}

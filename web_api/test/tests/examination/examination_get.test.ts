import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import testExaminationRoutes from "@/routers/test/examination.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  createPracticeExamination,
  DEFAULT_QUESTIONS,
  ExamPlan,
  getExamination,
  getExaminationRecord,
  prepareExamination,
  prepareExaminationTemplate,
  setExaminationResultAllowViewDate,
} from "#test/utils/examination.ts";
import { ExaminationInfoOutput, ExamQuestionType } from "@ijia/api-types";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
  testExaminationRoutes.apply(hono);
});

test("可以获取自己的考试信息", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  {
    const { examination_id } = await createPracticeExamination(alice.token, { question_total: 0 });

    const detail = await getExamination(alice.token, examination_id);
    expect(detail).toMatchObject({
      id: examination_id,
      title: "模拟考试",
    });
  }
  {
    const { templateId } = await prepareExaminationTemplate([
      { answer_index: [0], question_type: ExamQuestionType.SingleChoice, score: 1 },
      { answer_index: [1], question_type: ExamQuestionType.MultipleChoice, score: 2 },
    ]);
    const examination_id = await prepareExamination({
      userId: alice.id,
      templateId,
      questionTotal: 0,
    });
    const detail = await getExamination(alice.token, examination_id);
    expect(detail).toMatchObject({
      id: examination_id.toString(),
      total_score: 3,
      question_number: 2,
    } satisfies Partial<ExaminationInfoOutput>);
  }
});

test("获取他人的考试信息应返回 404", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { examination_id } = await createPracticeExamination(alice.token, { question_total: 0 });

  await expect(getExamination(bob.token, examination_id)).responseStatus(404);
});

test("交卷前，查看作答记录应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { examination_id } = await createPracticeExamination(alice.token, { question_total: 0 });

  await expect(getExaminationRecord(alice.token, examination_id)).responseStatus(409);
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

  await expect(plan.getResult(), "结果未开放前获取结果应返回 404").responseStatus(404);
  const recordBefore = await plan.getRecord();
  expect(recordBefore.questions[0].question?.answer, "结果未开放前不应展示答案").toBeUndefined();
  expect(recordBefore.questions[0].score, "结果未开放前不应展示得分").toBeNullable();
  expect(recordBefore.questions[0].isTimeout, "结果未开放前不应展示是否超时").toBeNullable();

  await setExaminationResultAllowViewDate(examination_id, new Date(Date.now() - 1000));

  await expect(plan.getResult()).resolves.toBeTypeOf("object");
  const recordAfter = await plan.getRecord();
  expect(recordAfter.questions[0].question?.answer?.answer_index).toEqual([0]);
});

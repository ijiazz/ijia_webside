import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  answerExaminationQuestion,
  prepareExamination,
  endExamination,
  getExaminationRecord,
  getExaminationResult,
  nextExaminationQuestion,
  startExamination,
  prepareExaminationTemplate,
  getExamination,
} from "#test/utils/examination.ts";
import { ExaminationStatus, ExamQuestionType } from "@ijia/api-types";
import { ExamPlan } from "#test/utils/examination/ExamPlan.ts";
import { afterTime } from "evlib";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
});

async function answerByPlan(
  api: Context["api"],
  token: string,
  examinationId: string | number,
  plan: Array<number[] | null>,
) {
  await startExamination(api, token, examinationId);
  for (let index = 0; index < plan.length; index++) {
    const next = await nextExaminationQuestion(api, token, examinationId);
    if (!next.question) break;
    const answer = plan[next.question.index];
    if (answer) {
      await answerExaminationQuestion(api, token, examinationId, { index: next.question.index, answer });
    } else {
      break;
    }
  }
  await endExamination(api, token, examinationId);
}

test("三个题目：正确作答 1 题，错误作答 1 题并直接交卷，然后查看考试结果、作答记录", async function ({
  api,
  publicDbPool,
}) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate();
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await answerByPlan(api, alice.token, examination_id, [[0], [1], null]);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 1, correct_number: 1, wrong_number: 1, unanswered_number: 1 });
  const record = await getExaminationRecord(api, alice.token, examination_id);
  expect(record.questions).toHaveLength(3);
});

test("三个题目：全部作答正确并交卷，然后查看考试结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate();
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await answerByPlan(api, alice.token, examination_id, [[0], [0], [0]]);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 3, correct_number: 3, wrong_number: 0, unanswered_number: 0 });
});

test("三个题目：正确作答 1 题并直接交卷，然后查看考试结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate();
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await answerByPlan(api, alice.token, examination_id, [[0], null, null]);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 1, correct_number: 1, wrong_number: 0, unanswered_number: 2 });
});

test("三个题目：全部错误作答，并交卷，然后查看考试结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate();
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await answerByPlan(api, alice.token, examination_id, [[2], [2], [2]]);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 0, correct_number: 0, wrong_number: 3, unanswered_number: 0 });
});

test("没有题目的考试可以交卷，并查看考试结果、作答记录", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate([]);
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await endExamination(api, alice.token, examination_id);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 0, correct_number: 0, wrong_number: 0, unanswered_number: 0 });
  const record = await getExaminationRecord(api, alice.token, examination_id);
  expect(record.questions).toHaveLength(0);
});
test("正常流程的考试状态", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examId = await prepareExamination({
    userId: alice.id,
    allowTimeEnd: new Date(),
  });
  const getExamStatus = () => getExamination(api, alice.token, examId).then((detail) => detail.status);
  await expect(getExamStatus(), "可开考").resolves.toBe(ExaminationStatus.ready);
  await startExamination(api, alice.token, examId);
  await expect(getExamStatus(), "进行中").resolves.toBe(ExaminationStatus.ongoing);
  await endExamination(api, alice.token, examId);
  await expect(getExamStatus(), "已出结果").resolves.toBe(ExaminationStatus.result);
});
test("缺考的考试状态", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examId = await prepareExamination({
    userId: alice.id,
    allowTimeEnd: new Date(Date.now() + 1000),
  });
  const getExamStatus = () => getExamination(api, alice.token, examId).then((detail) => detail.status);
  await expect(getExamStatus(), "可开考").resolves.toBe(ExaminationStatus.ready);
  await afterTime(1000);
  await expect(getExamStatus(), "已结束").resolves.toBe(ExaminationStatus.result);
});
test("终止考试的状态", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examId = await prepareExamination({
    userId: alice.id,
    allowTimeEnd: new Date(Date.now() + 1000),
  });
  const getExamStatus = () => getExamination(api, alice.token, examId).then((detail) => detail.status);
  await expect(getExamStatus(), "可开考").resolves.toBe(ExaminationStatus.ready);
  await startExamination(api, alice.token, examId);
  await expect(getExamStatus(), "进行中").resolves.toBe(ExaminationStatus.ongoing);
  await afterTime(1000);
  await expect(getExamStatus(), "进行中").resolves.toBe(ExaminationStatus.ended);
  await endExamination(api, alice.token, examId);
  await expect(getExamStatus(), "已出结果").resolves.toBe(ExaminationStatus.result);
});

test("多选题全部正确，获得满分，部分正确，获得一般，存在错误，获得零分", async function ({ api, publicDbPool }) {
  const { templateId } = await prepareExaminationTemplate([
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 2], score: 3 }, // 这题作答完全正确，测试完全正确的情况
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 2], score: 1 }, // 这题作答部分正确，测试部分正确的情况
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 2], score: 1 }, // 这题作答错误，测试错误题的情况
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 2], score: 1 }, // 这题提交空选项
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 2], score: 1 }, // 这题不作答，测试未答题的情况
  ]);
  const alice = await prepareUniqueUser("alice");
  const examination_id = await prepareExamination({ userId: alice.id, templateId });
  const plan = new ExamPlan(api, alice.token, examination_id);

  await plan.start();
  await plan.commitGetNext([1, 2]);
  await plan.commitGetNext([1]);
  await plan.commitGetNext([1, 3]);
  await plan.commitGetNext([]);
  await plan.commitGetNext([]);
  await plan.end();
  const result = await plan.getResult();
  expect(result.grade).toBe(3.5);
  expect(result).toMatchObject({
    correct_number: 1,
    partially_correct_number: 1,
    wrong_number: 2,
    unanswered_number: 1,
  } satisfies Partial<typeof result>);
});

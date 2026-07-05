import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  prepareExamination,
  endExamination,
  ExamPlan,
  startExamination,
  prepareExaminationTemplate,
  getExamination,
  setExaminationAllowDate,
  setExaminationResultAllowViewDate,
  DEFAULT_QUESTIONS,
} from "#test/utils/examination.ts";
import { ExaminationStatus, ExamQuestionType } from "@ijia/api-types";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
});

test("没有题目的考试可以交卷，并查看考试结果、作答记录", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate([]);
  const examination_id = await prepareExamination({ userId: alice.id, templateId });
  const plan = new ExamPlan(api, alice.token, examination_id);
  await plan.start();
  await plan.end();

  const result = await plan.getResult();
  expect(result).toMatchObject({ grade: 0, correct_number: 0, wrong_number: 0, unanswered_number: 0 });
  const record = await plan.getRecord();
  expect(record.questions).toHaveLength(0);
});
test("正常流程的考试状态", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examId = await prepareExamination({
    userId: alice.id,
    questionTotal: 3,
    resultAllowViewDate: new Date(Date.now() + 1000),
  });
  const plan = new ExamPlan(api, alice.token, examId);

  const getExamStatus = () => getExamination(api, alice.token, examId).then((detail) => detail.status);
  await expect(getExamStatus(), "可开考").resolves.toBe(ExaminationStatus.ready);
  await plan.start();

  await expect(getExamStatus(), "进行中").resolves.toBe(ExaminationStatus.ongoing);
  await plan.end();
  await expect(getExamStatus(), "考试结束").resolves.toBe(ExaminationStatus.ended);
  await setExaminationResultAllowViewDate(examId, new Date(Date.now() - 1000));
  await expect(getExamStatus(), "已出结果").resolves.toBe(ExaminationStatus.result);
});
test("缺考", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examId = await prepareExamination({
    userId: alice.id,
    allowTimeEnd: new Date(Date.now() + 1000),
  });
  const getExamStatus = () => getExamination(api, alice.token, examId).then((detail) => detail.status);
  await expect(getExamStatus(), "可开考").resolves.toBe(ExaminationStatus.ready);
  await setExaminationAllowDate(examId, { to: new Date(Date.now() - 1000) });
  await expect(getExamStatus(), "缺考没有考试接口").resolves.toBe(ExaminationStatus.ended);
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
  await setExaminationAllowDate(examId, { to: new Date(Date.now() - 1000) });
  await expect(getExamStatus(), "进行中").resolves.toBe(ExaminationStatus.ended);
  await endExamination(api, alice.token, examId);
  await expect(getExamStatus(), "已出结果").resolves.toBe(ExaminationStatus.result);
});

test("多选题全部正确，获得满分，部分正确，获得一半，存在错误，获得零分", async function ({ api, publicDbPool }) {
  const { templateId } = await prepareExaminationTemplate([
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 2], score: 4 }, // 这题作答完全正确，测试完全正确的情况
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 2], score: 2 }, // 这题作答部分正确，测试部分正确的情况
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 2], score: 2 }, // 这题提交空选项
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 2], score: 2 }, // 这题作答错误，测试错误题的情况
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [1, 2], score: 2 }, // 这题不作答，测试未答题的情况
  ]);

  const alice = await prepareUniqueUser("alice");
  const examination_id = await prepareExamination({ userId: alice.id, templateId });
  const plan = new ExamPlan(api, alice.token, examination_id);

  await plan.start();
  await plan.commitGetNext([1, 2]);
  await plan.commitGetNext([1]);
  await plan.commitGetNext([]); //跳过
  await plan.commitGetNext([1, 3]);
  await plan.end();
  const record = await plan.getRecord();
  expect(record.questions.map((q) => ({ score: q.score, index: q.index }))).toEqual([
    { index: 0, score: 4 },
    { index: 1, score: 1 },
    { index: 2, score: 0 },
    { index: 3, score: 0 },
  ]);
  const result = await plan.getResult();
  expect(result.grade).toBe(5);
  expect(result).toMatchObject({
    correct_number: 1,
    partially_correct_number: 1,
    wrong_number: 1,
    unanswered_number: 2,
  } satisfies Partial<typeof result>);
});
test("打乱题目顺序", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate([
    { question_type: ExamQuestionType.SingleChoice, answer_index: [0], option_map: [2, 0, 1] },
    { question_type: ExamQuestionType.SingleChoice, answer_index: [1], option_map: [2, 0, 1] },
    { question_type: ExamQuestionType.SingleChoice, answer_index: [2], option_map: [2, 0, 1] },
    { question_type: ExamQuestionType.SingleChoice, answer_index: [2], option_map: [1, 0, 2] },
  ]);

  const examination_id = await prepareExamination({ userId: alice.id, templateId });
  const plan = new ExamPlan(api, alice.token, examination_id);
  await plan.start();
  const q0 = await plan.commitGetNext([2]);
  const expectOptions = ["选项-1", "选项-2", "选项-0", "选项-3"];
  expect(q0.options?.map((o) => o.text)).toEqual(expectOptions);
  const q1 = await plan.commitGetNext([0]);
  const q2 = await plan.commitGetNext([1]);
  const q3 = await plan.commitGetNext([2]);
  await plan.end();
  const record = await plan.getRecord();
  expect(record.questions.map((q) => ({ score: q.score, index: q.index }))).toEqual([
    { index: 0, score: 1 },
    { index: 1, score: 1 },
    { index: 2, score: 1 },
    { index: 3, score: 1 },
  ]);
  expect(record.questions[0].question?.options?.map((o) => o.text)).toEqual(expectOptions);
  const result = await plan.getResult();
  expect(result).toMatchObject({
    grade: 4,
    correct_number: 4,
  });
});
test("三个题目：全部作答正确并交卷，然后查看考试结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS);
  const examination_id = await prepareExamination({ userId: alice.id, templateId });
  const plan = new ExamPlan(api, alice.token, examination_id);

  await plan.start();
  await plan.commitGetNext([0]);
  await plan.commitGetNext([1]);
  await plan.commitGetNext([2]);
  await plan.end();

  const result = await plan.getResult();
  expect(result).toMatchObject({
    grade: 3,
    correct_number: 3,
    wrong_number: 0,
    unanswered_number: 0,
  });
});
test("三个题目：正确作答 1 题，跳过 1 题并直接交卷，然后查看考试结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS);
  const examination_id = await prepareExamination({ userId: alice.id, templateId });
  const plan = new ExamPlan(api, alice.token, examination_id);
  await plan.start();
  await plan.commitGetNext([0]);
  await plan.commitGetNext([]);
  await plan.end();

  const result = await plan.getResult();
  expect(result).toMatchObject({
    grade: 1,
    correct_number: 1,
    wrong_number: 0,
    unanswered_number: 2,
  });
});
test("三个题目：全部错误作答，并交卷，然后查看考试结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS);
  const examination_id = await prepareExamination({ userId: alice.id, templateId });
  const plan = new ExamPlan(api, alice.token, examination_id);
  await plan.start();
  await plan.commitGetNext([3]);
  await plan.commitGetNext([3]);
  await plan.commitGetNext([3]);
  await plan.end();

  const result = await plan.getResult();
  expect(result).toMatchObject({
    grade: 0,
    correct_number: 0,
    wrong_number: 3,
    unanswered_number: 0,
  });
});
test("题目超时", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate([
    { question_type: ExamQuestionType.SingleChoice, answer_index: [0], time_limit: -1 },
  ]);
  const examination_id = await prepareExamination({ userId: alice.id, templateId });
  const plan = new ExamPlan(api, alice.token, examination_id);
  await plan.start();
  await plan.commitGetNext([0]);
  await plan.end();

  const record = await plan.getRecord();
  expect(record.questions[0].isTimeout).toBe(true);
  const result = await plan.getResult();
  expect(result).toMatchObject({
    grade: 0,
    correct_number: 0,
    wrong_number: 1,
    unanswered_number: 0,
  });
});

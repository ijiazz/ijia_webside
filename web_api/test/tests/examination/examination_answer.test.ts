import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import testExaminationRoutes from "@/routers/test/examination.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  answerExaminationQuestion,
  prepareExamination,
  endExamination,
  nextExaminationQuestion,
  startExamination,
  prepareExaminationTemplate,
  ExamPlan,
  DEFAULT_QUESTIONS,
} from "#test/utils/examination.ts";
import { ExamQuestionType } from "@ijia/api-types";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
  testExaminationRoutes.apply(hono);
});

test("提交他人考试的题目信息，应返回 404", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS);
  const examinationId = await prepareExamination({ userId: alice.id, templateId: templateId });
  await expect(answerExaminationQuestion(bob.token, examinationId, { index: 0, answer: [0] })).responseStatus(404);
});

test("已经提交的题目，再次提交应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS);
  const examinationId = await prepareExamination({ userId: alice.id, templateId: templateId });

  await startExamination(alice.token, examinationId);
  const { question } = await nextExaminationQuestion(alice.token, examinationId);
  const index = question!.index;
  await answerExaminationQuestion(alice.token, examinationId, { index, answer: [0] });

  await expect(answerExaminationQuestion(alice.token, examinationId, { index, answer: [0] })).responseStatus(409);
});

test("提交未开始作答的题目，应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS);
  const examinationId = await prepareExamination({ userId: alice.id, templateId: templateId });

  await startExamination(alice.token, examinationId);
  await expect(answerExaminationQuestion(alice.token, examinationId, { index: 1, answer: [0] })).responseStatus(
    409,
  );
});

test("交卷后，不能继续作答", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS);
  const examinationId = await prepareExamination({ userId: alice.id, templateId: templateId });

  await startExamination(alice.token, examinationId);
  const question = await nextExaminationQuestion(alice.token, examinationId);
  await answerExaminationQuestion(alice.token, examinationId, { index: question.question!.index, answer: [0] });
  await endExamination(alice.token, examinationId);

  await expect(
    answerExaminationQuestion(alice.token, examinationId, { index: question.question!.index, answer: [0] }),
  ).responseStatus(409);
});
test("答案可以为空", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate([
    { question_type: ExamQuestionType.MultipleChoice, answer_index: [0, 1] },
    { question_type: ExamQuestionType.SingleChoice, answer_index: [0] },
    { question_type: ExamQuestionType.TrueOrFalse, answer_index: [0] },
  ]);
  const examinationId = await prepareExamination({ userId: alice.id, templateId: templateId });
  const plan = new ExamPlan(api, alice.token, examinationId);
  await plan.start();
  await plan.commitGetNext([]);
  await plan.commitGetNext([]);
  await plan.commitGetNext([]);
});

test("单选题答案超不符合要求应返回 400", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate([
    { answer_index: [0], question_type: ExamQuestionType.SingleChoice },
  ]);
  const examinationId = await prepareExamination({ userId: alice.id, templateId: templateId });

  const answer = (answer: number[]) => answerExaminationQuestion(alice.token, examinationId, { index: 0, answer });
  await expect(answer([0, 1]), "单选题只能选择一个答案").responseStatus(400);
  await expect(answer([20]), "单选题不能选择超过选项数量").responseStatus(400);
});
test("多选题答案超不符合要求应返回 400", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate([
    { answer_index: [0], question_type: ExamQuestionType.MultipleChoice },
  ]);
  const examinationId = await prepareExamination({ userId: alice.id, templateId: templateId });
  const answer = (answer: number[]) => answerExaminationQuestion(alice.token, examinationId, { index: 0, answer });
  await expect(answer([0, 1, 2, 3, 4]), "多选题不能选择超过选项数量").responseStatus(400);
  await expect(answer([5, 6]), "多选题不能选择超过选项数量").responseStatus(400);
});
test("判断题答案超不符合要求应返回 400", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate([
    { answer_index: [0], question_type: ExamQuestionType.TrueOrFalse },
  ]);
  const examinationId = await prepareExamination({ userId: alice.id, templateId: templateId });
  const answer = (answer: number[]) => answerExaminationQuestion(alice.token, examinationId, { index: 0, answer });
  await expect(answer([0, 1]), "判断题只能选择一个答案").responseStatus(400);
  await expect(answer([-1]), "判断题只能选择0或1").responseStatus(400);
  await expect(answer([2]), "判断题只能选择0或1").responseStatus(400);
});

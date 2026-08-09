import { beforeEach, expect, describe } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import testExaminationRoutes from "@/routers/test/examination.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  createPracticeExamination,
  DEFAULT_QUESTIONS,
  deleteExamination,
  endExamination,
  getExamination,
  getExaminationRealQuestionTotal,
  prepareExamination,
  prepareExaminationTemplate,
  startExamination,
} from "#test/utils/examination.ts";
import { v } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
import {} from "node:test";
import { ExamQuestionType } from "@ijia/school-db/db";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
  testExaminationRoutes.apply(hono);
});
describe("可以删除刚创建的自己的考试", async function () {
  test("可以删除刚创建的自己的考试", async function ({ api, publicDbPool }) {
    const alice = await prepareUniqueUser("alice");
    const { examination_id } = await createPracticeExamination(alice.token, { question_total: 0 });

    await deleteExamination(alice.token, examination_id);
    await expect(getExamination(alice.token, examination_id)).responseStatus(404);
  });
  test("可以删除已经开始的模拟考试", async function ({ api, publicDbPool }) {
    const alice = await prepareUniqueUser("alice");
    const { examination_id } = await createPracticeExamination(alice.token, { question_total: 0 });
    await startExamination(alice.token, examination_id);
    await deleteExamination(alice.token, examination_id);
    await expect(getExamination(alice.token, examination_id)).responseStatus(404);
  });
  test("可以删除已经结束的模拟考试", async function ({ api, publicDbPool }) {
    const alice = await prepareUniqueUser("alice");
    const { examination_id } = await createPracticeExamination(alice.token, { question_total: 0 });
    await startExamination(alice.token, examination_id);
    await endExamination(alice.token, examination_id);
    await deleteExamination(alice.token, examination_id);
    await expect(getExamination(alice.token, examination_id)).responseStatus(404);
  });
});

test("删除不存在的考试时，应返回 404", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  await expect(deleteExamination(alice.token, "999999")).responseStatus(404);
});

test("删除别人的考试时，应返回 404", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { examination_id } = await createPracticeExamination(alice.token, { question_total: 0 });

  await expect(deleteExamination(bob.token, examination_id)).responseStatus(404);
});

test("删除考试时，模板和模板题绑定会一起删除", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const { examination_id } = await createPracticeExamination(alice.token, { question_total: 1 });
  await startExamination(alice.token, examination_id);
  await expect(getExaminationRealQuestionTotal(+examination_id)).resolves.toBe(1);
  const templateId = await getTemplateId(+examination_id);
  await deleteExamination(alice.token, examination_id);

  await expect(getTemplate(templateId)).resolves.toBe(0);

  await expect(getExaminationRealQuestionTotal(+examination_id)).resolves.toBe(0);
  await expect(getExamination(alice.token, examination_id)).responseStatus(404);
});
test("模板被删除时，关联的系统题目应一起删除", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { questionIds, templateId } = await prepareExaminationTemplate(
    [
      { answer_index: [0], question_type: ExamQuestionType.SingleChoice },
      { answer_index: [0], question_type: ExamQuestionType.SingleChoice },
    ],
    { ownerId: alice.id },
  );
  await setQuestionToSys(questionIds[0]);
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await startExamination(alice.token, examination_id);
  await expect(getExaminationRealQuestionTotal(+examination_id)).resolves.toBe(2);

  await deleteExamination(alice.token, examination_id);

  await expect(getTemplate(templateId)).resolves.toBe(0);

  await expect(getExaminationRealQuestionTotal(+examination_id)).resolves.toBe(0);
  await expect(getExamination(alice.token, examination_id)).responseStatus(404);

  await expect(getQuestion(questionIds[0]), "系统题目应被删除").resolves.toBe(0);
  await expect(getQuestion(questionIds[1]), "非系统题目应保留").resolves.toBe(1);
});

test("别人分配的考试，不能被删除", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  {
    const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS, { ownerId: alice.id });
    const examId = await prepareExamination({ userId: bob.id, templateId });
    const exam = await getExamination(bob.token, examId);
    expect(exam.owner?.id).toBe(alice.id.toString());
    await expect(deleteExamination(bob.token, examId)).responseStatus(403);
  }
  {
    const { templateId } = await prepareExaminationTemplate(DEFAULT_QUESTIONS);
    const examId = await prepareExamination({ userId: bob.id, templateId });
    const exam = await getExamination(bob.token, examId);
    expect(exam.owner?.id).toBe(undefined);
    await expect(deleteExamination(bob.token, examId)).responseStatus(403);
  }
});
async function getTemplateId(examination_id: number) {
  const result = await dbPool.queryRows<{ template_id: number }>(v.gen`
    SELECT template_id FROM examination WHERE id=${+examination_id}`);
  return result[0]?.template_id;
}
async function getTemplate(templateId: number) {
  return await dbPool.queryCount(v.gen`
    SELECT * FROM exam_paper_template WHERE id=${templateId}`);
}
async function getQuestion(id: number) {
  return await dbPool.queryCount(v.gen`
    SELECT * FROM exam_question WHERE id=${id}`);
}
async function setQuestionToSys(id: number) {
  await dbPool.execute(v.gen`
    UPDATE exam_question SET is_system_gen=true WHERE id=${id}`);
}

import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  createPracticeExamination,
  deleteExamination,
  endExamination,
  getExamination,
  getExaminationRealQuestionTotal,
  preparePassedQuestions,
  startExamination,
} from "#test/utils/examination.ts";
import { v } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
});

test("可以删除刚创建的自己的考试", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 0 });

  await deleteExamination(api, alice.token, examination_id);
  await expect(getExamination(api, alice.token, examination_id)).responseStatus(404);
});
test("可以删除已经开始的模拟考试", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 0 });
  await startExamination(api, alice.token, examination_id);
  await deleteExamination(api, alice.token, examination_id);
  await expect(getExamination(api, alice.token, examination_id)).responseStatus(404);
});
test("可以删除已经结束的模拟考试", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 0 });
  await startExamination(api, alice.token, examination_id);
  await endExamination(api, alice.token, examination_id);
  await deleteExamination(api, alice.token, examination_id);
  await expect(getExamination(api, alice.token, examination_id)).responseStatus(404);
});

test("删除不存在的考试时，应返回 404", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  await expect(deleteExamination(api, alice.token, "999999")).responseStatus(404);
});

test("删除别人的考试时，应返回 404", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 0 });

  await expect(deleteExamination(api, bob.token, examination_id)).responseStatus(404);
});

test("删除考试时，模板和模板题绑定会一起删除", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  await preparePassedQuestions(1, alice.id);

  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 1 });
  await startExamination(api, alice.token, examination_id);
  await expect(getExaminationRealQuestionTotal(+examination_id)).resolves.toBe(1);
  const templateId = await getTemplateId(+examination_id);
  await deleteExamination(api, alice.token, examination_id);

  await expect(getTemplate(templateId)).resolves.toBe(0);

  await expect(getExaminationRealQuestionTotal(+examination_id)).resolves.toBe(0);
  await expect(getExamination(api, alice.token, examination_id)).responseStatus(404);
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
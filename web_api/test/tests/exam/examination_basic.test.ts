import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  createExamination,
  deleteExamination,
  getExamination,
  listExamination,
  preparePassedQuestions,
} from "#test/utils/examination.ts";
import { v } from "@/sql/utils.ts";

beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
  examinationRoutes.apply(hono);
});

test("可以创建模拟考试，并在列表和详情中查看", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  await preparePassedQuestions(2, alice.token, api);

  const { examination_id } = await createExamination(api, alice.token, { question_total: 2 });

  const list = await listExamination(api, alice.token);
  expect(list.items).toHaveLength(1);
  expect(list.items[0]).toMatchObject({
    title: "模拟考试",
    status: "ready",
    question_number: 2,
  });

  const detail = await getExamination(api, alice.token, examination_id);
  expect(detail).toMatchObject({
    title: "模拟考试",
    status: "ready",
    question_number: 2,
  });
});

test("可以创建没有题目的模拟考试", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const { examination_id } = await createExamination(api, alice.token, { question_total: 0 });
  const detail = await getExamination(api, alice.token, examination_id);

  expect(detail).toMatchObject({
    title: "模拟考试",
    status: "ready",
    question_number: 0,
  });
});

test("不能查看或删除别人的考试", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { examination_id } = await createExamination(api, alice.token, { question_total: 0 });

  await expect(getExamination(api, bob.token, examination_id)).responseStatus(404);
  await expect(deleteExamination(api, bob.token, examination_id)).responseStatus(404);
});

test("删除考试时，应一起删除专属模板", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  await preparePassedQuestions(1, alice.token, api);

  const { examination_id } = await createExamination(api, alice.token, { question_total: 1 });
  const examinationRow = await publicDbPool.queryFirstRow<{ template_id: number }>(
    v.gen`SELECT template_id FROM examination WHERE id=${examination_id}`,
  );

  await deleteExamination(api, alice.token, examination_id);

  const examCount = await publicDbPool.queryFirstRow<{ total: number }>(
    v.gen`SELECT COUNT(*)::int AS total FROM examination WHERE id=${examination_id}`,
  );
  expect(examCount.total).toBe(0);
  const templateCount = await publicDbPool.queryFirstRow<{ total: number }>(
    v.gen`SELECT COUNT(*)::int AS total FROM exam_paper_template WHERE id=${examinationRow.template_id}`,
  );
  expect(templateCount.total).toBe(0);
  const templateQuestionCount = await publicDbPool.queryFirstRow<{ total: number }>(
    v.gen`SELECT COUNT(*)::int AS total FROM exam_paper_template_question WHERE paper_template_id=${examinationRow.template_id}`,
  );
  expect(templateQuestionCount.total).toBe(0);
  await expect(getExamination(api, alice.token, examination_id)).responseStatus(404);
});

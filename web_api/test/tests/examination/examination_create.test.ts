import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  createPracticeExamination,
  getExamination,
  getExaminationTemplate,
  prepareExamination,
  preparePassedQuestions,
} from "#test/utils/examination.ts";
import { ExaminationStatus } from "@ijia/api-types";
import { v } from "@/sql/utils.ts";
import { dbPool } from "@/db/client.ts";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
});

test("允许用户给自己创建模拟考试", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  await preparePassedQuestions(2, alice.id);

  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 2 });
  const detail = await getExamination(api, alice.token, examination_id);

  expect(detail.title).toBe("模拟考试");
  expect(detail.question_number, "总数应等于2").toBe(2);
  expect(detail.owner?.id, "自己创建的模拟考试，owner 应为自己").toBe(alice.id.toString());
  expect(detail.status).toBe(ExaminationStatus.ready);
});

test("模拟考试创建后，创建的试卷模板应暂未绑定题目", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  await preparePassedQuestions(2, alice.id);

  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 2 });
  const { template_id } = await getExaminationTemplate(+examination_id);

  await expect(getExaminationRealQuestionNumber(template_id)).resolves.toBe(0);
});

async function getExaminationRealQuestionNumber(template_id: number) {
  const [questionRows] = await dbPool.queryRows<{ count: number }>(v.gen`
    SELECT count(*)::INT FROM exam_paper_template_question WHERE paper_template_id=${template_id}
  `);
  return questionRows.count;
}
test("未到考试开始时间，获取考试信息时状态应为 upcoming", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examId = await prepareExamination({
    userId: alice.id,
    allowTimeStart: new Date(Date.now() + 1000 * 60),
  });

  const detail = await getExamination(api, alice.token, examId.toString());
  expect(detail.status).toBe("upcoming");
});

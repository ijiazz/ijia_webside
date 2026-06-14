import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  answerExaminationQuestion,
  createPracticeExamination,
  prepareExamination,
  endExamination,
  getExaminationRecord,
  getExaminationResult,
  nextExaminationQuestion,
  prepareExaminationTemplate,
} from "#test/utils/examination.ts";
import { v } from "@/sql/utils.ts";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
});

test("交卷前，查看作答记录应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 0 });

  await expect(getExaminationRecord(api, alice.token, examination_id)).responseStatus(409);
});

test("结果开放前，查看考试结果应返回 409，记录中不展示正确答案；开放后可查看结果", async function ({
  api,
  publicDbPool,
}) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate();
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  const question = await nextExaminationQuestion(api, alice.token, examination_id);
  await answerExaminationQuestion(api, alice.token, examination_id, { index: question.question!.index, answer: [1] });
  await endExamination(api, alice.token, examination_id);

  await publicDbPool.execute(v.gen`
    UPDATE examination
    SET result_allow_view_date = now() + interval '1 day'
    WHERE id=${examination_id}
  `);

  await expect(getExaminationResult(api, alice.token, examination_id)).responseStatus(409);
  const recordBefore = await getExaminationRecord(api, alice.token, examination_id);
  expect(recordBefore.questions[0].question?.answer).toBeUndefined();

  await publicDbPool.execute(v.gen`
    UPDATE examination
    SET result_allow_view_date = now() - interval '1 second'
    WHERE id=${examination_id}
  `);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 1, correct_number: 1, wrong_number: 0, unanswered_number: 0 });
  const recordAfter = await getExaminationRecord(api, alice.token, examination_id);
  expect(recordAfter.questions[0].question?.answer?.answer_index).toEqual([1]);
});

test.todo("成绩统计完成前，查看考试接口应返回空，在统计完成后，才能查看考试结果");

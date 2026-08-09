import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import testExaminationRoutes from "@/routers/test/examination.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  createPracticeExamination,
  DEFAULT_QUESTIONS,
  ExamPlan,
  listExamination,
  prepareExamination,
  prepareExaminationTemplate,
  setExaminationResultAllowViewDate,
} from "#test/utils/examination.ts";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
  testExaminationRoutes.apply(hono);
});

test("获取自己的考试列表时，只返回自己的考试", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");

  await createPracticeExamination(alice.token, { question_total: 0 });
  await createPracticeExamination(alice.token, { question_total: 0 });
  await createPracticeExamination(bob.token, { question_total: 0 });

  const list = await listExamination(alice.token);
  expect(list.items).toHaveLength(2);
  expect(list.items.every((item) => item.title === "模拟考试")).toBe(true);
});
test("考试结果开放前，不应显示得分", async function ({ api, publicDbPool }) {
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

  {
    const list = await listExamination(alice.token);
    expect(list.items).toHaveLength(1);
    expect(list.items[0].score).toBeNullable();
  }

  await setExaminationResultAllowViewDate(+examination_id, new Date(Date.now() - 1000));

  {
    const list = await listExamination(alice.token);
    expect(list.items).toHaveLength(1);
    expect(list.items[0].score).toBe(0);
  }
});

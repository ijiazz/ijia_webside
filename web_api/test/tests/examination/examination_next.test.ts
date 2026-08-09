import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import testExaminationRoutes from "@/routers/test/examination.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  answerExaminationQuestion,
  prepareExamination,
  nextExaminationQuestion,
  startExamination,
  endExamination,
} from "#test/utils/examination.ts";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
  testExaminationRoutes.apply(hono);
});

test("获取下一题时，应按顺序返回未提交的题目", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examination_id = await prepareExamination({
    userId: alice.id,
    questionTotal: 3,
  });

  await startExamination(alice.token, examination_id);

  const q1 = await nextExaminationQuestion(alice.token, examination_id);
  expect(q1.question?.index).toBe(0);
  await answerExaminationQuestion(alice.token, examination_id, { index: 0, answer: [1] });

  const q2 = await nextExaminationQuestion(alice.token, examination_id);
  expect(q2.question?.index).toBe(1);
  await answerExaminationQuestion(alice.token, examination_id, { index: 1, answer: [0] });

  const q3 = await nextExaminationQuestion(alice.token, examination_id);
  expect(q3.question?.index).toBe(2);
});
test("重复获取下下一题，数据应不会改变", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examination_id = await prepareExamination({
    userId: alice.id,
    questionTotal: 3,
  });

  await startExamination(alice.token, examination_id);

  const { question: q1 } = await nextExaminationQuestion(alice.token, examination_id);
  const { question: q2 } = await nextExaminationQuestion(alice.token, examination_id);
  expect(q1).toEqual(q2);
});
test("获取别人考试的题目应返回 404", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const examination_id = await prepareExamination({
    userId: alice.id,
    questionTotal: 3,
  });

  await expect(nextExaminationQuestion(bob.token, examination_id)).responseStatus(404);
});

test("获取未开始考试的题目应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examination_id = await prepareExamination({ userId: alice.id });

  await expect(nextExaminationQuestion(alice.token, examination_id)).responseStatus(409);
});

test("获取已结束考试的题目应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examination_id = await prepareExamination({ userId: alice.id });

  await startExamination(alice.token, examination_id);
  await endExamination(alice.token, examination_id);
  await expect(nextExaminationQuestion(alice.token, examination_id)).responseStatus(409);
});

import { beforeEach, expect } from "vitest";
import { test, Context } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  createPracticeExamination,
  endExamination,
  prepareExamination,
  startExamination,
} from "#test/utils/examination.ts";

beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
  examinationRoutes.apply(hono);
});

test("交卷别人的考试，应返回 404", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const bob = await prepareUniqueUser("bob");
  const { examination_id } = await createPracticeExamination(api, alice.token, { question_total: 0 });

  await expect(endExamination(api, bob.token, examination_id)).responseStatus(404);
});
test("结束未允许未开考的考试，应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examination_id = await prepareExamination({
    userId: alice.id,
    questionTotal: 0,
    allowTimeStart: new Date(Date.now() + 1000 * 60),
  });

  await expect(endExamination(api, alice.token, examination_id)).responseStatus(409);
});
test("结束未开考的考试，应返回409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examination_id = await prepareExamination({ userId: alice.id, questionTotal: 0 });
  await expect(endExamination(api, alice.token, examination_id)).responseStatus(409);
});
test("结束已结束的考试，应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examination_id = await prepareExamination({ userId: alice.id, questionTotal: 0 });

  await startExamination(api, alice.token, examination_id);
  await endExamination(api, alice.token, examination_id);

  await expect(endExamination(api, alice.token, examination_id), "结束已结束的考试，应返回 409").responseStatus(409);
});
test("结束未开考，但是已经过了允许开考时间的考试，应返回 409", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examination_id = await prepareExamination({
    userId: alice.id,
    questionTotal: 0,
    allowTimeStart: new Date(Date.now() - 1000 * 60),
  });

  await expect(endExamination(api, alice.token, examination_id)).responseStatus(409);
});

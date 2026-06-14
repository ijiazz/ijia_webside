import { beforeEach, expect } from "vitest";
import { test, Context, JWT_TOKEN_KEY } from "#test/fixtures/hono.ts";
import examinationRoutes from "@/routers/examination/mod.ts";
import { prepareUniqueUser } from "#test/utils/user.ts";
import {
  answerExaminationQuestion,
  prepareExamination,
  endExamination,
  getExaminationRecord,
  getExaminationResult,
  nextExaminationQuestion,
  startExamination,
  prepareExaminationTemplate,
  getExamination,
} from "#test/utils/examination.ts";
import { ExaminationStatus } from "@ijia/api-types";

beforeEach<Context>(async ({ hono }) => {
  examinationRoutes.apply(hono);
});
class CommitByNextPlan {
  constructor(
    private api: Context["api"],
    private token: string,
    private examinationId: string | number,
  ) {
    this.api = api;
    this.token = token;
    this.examinationId = examinationId;
  }
  async commitGetNext(index: number, answer: number[]) {
    await this.api["/examination/:exam_id/answer"].post({
      body: { index, answer },
      params: { exam_id: this.examinationId.toString() },
      [JWT_TOKEN_KEY]: this.token,
    });
    const result = await this.api["/examination/:exam_id/next"].post({
      params: { exam_id: this.examinationId.toString() },
      [JWT_TOKEN_KEY]: this.token,
    });
    return result;
  }
}
async function answerByPlan(
  api: Context["api"],
  token: string,
  examinationId: string | number,
  plan: Array<number[] | null>,
) {
  await startExamination(api, token, examinationId);
  for (let index = 0; index < plan.length; index++) {
    const next = await nextExaminationQuestion(api, token, examinationId);
    if (!next.question) break;
    const answer = plan[next.question.index];
    if (answer) {
      await answerExaminationQuestion(api, token, examinationId, { index: next.question.index, answer });
    } else {
      break;
    }
  }
  await endExamination(api, token, examinationId);
}

test("三个题目：正确作答 1 题，错误作答 1 题并直接交卷，然后查看考试结果、作答记录", async function ({
  api,
  publicDbPool,
}) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate();
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await answerByPlan(api, alice.token, examination_id, [[0], [1], null]);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 1, correct_number: 1, wrong_number: 1, unanswered_number: 1 });
  const record = await getExaminationRecord(api, alice.token, examination_id);
  expect(record.questions).toHaveLength(3);
});

test("三个题目：全部作答正确并交卷，然后查看考试结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate();
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await answerByPlan(api, alice.token, examination_id, [[0], [0], [0]]);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 3, correct_number: 3, wrong_number: 0, unanswered_number: 0 });
});

test("三个题目：正确作答 1 题并直接交卷，然后查看考试结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate();
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await answerByPlan(api, alice.token, examination_id, [[0], null, null]);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 1, correct_number: 1, wrong_number: 0, unanswered_number: 2 });
});

test("三个题目：全部错误作答，并交卷，然后查看考试结果", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate();
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await answerByPlan(api, alice.token, examination_id, [[2], [2], [2]]);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 0, correct_number: 0, wrong_number: 3, unanswered_number: 0 });
});

test("没有题目的考试可以交卷，并查看考试结果、作答记录", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const { templateId } = await prepareExaminationTemplate([]);
  const examination_id = await prepareExamination({ userId: alice.id, templateId });

  await endExamination(api, alice.token, examination_id);

  const result = await getExaminationResult(api, alice.token, examination_id);
  expect(result).toMatchObject({ grade: 0, correct_number: 0, wrong_number: 0, unanswered_number: 0 });
  const record = await getExaminationRecord(api, alice.token, examination_id);
  expect(record.questions).toHaveLength(0);
});
test("考试状态", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const examId = await prepareExamination({
    userId: alice.id,
    allowTimeEnd: new Date(),
  });
  const getExamStatus = () => getExamination(api, alice.token, examId).then((detail) => detail.status);
  await expect(getExamStatus(), "可开考").resolves.toBe(ExaminationStatus.ready);
  await startExamination(api, alice.token, examId);
  await expect(getExamStatus(), "进行中").resolves.toBe(ExaminationStatus.ongoing);
  await endExamination(api, alice.token, examId);
  await expect(getExamStatus(), "已结束").resolves.toBe(ExaminationStatus.ended);
  await expect(getExamStatus(), "已出结果").resolves.toBe(ExaminationStatus.result);
});

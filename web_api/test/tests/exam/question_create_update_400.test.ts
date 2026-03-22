import { beforeEach, expect } from "vitest";
import { test, Context } from "../../fixtures/hono.ts";
import questionRoutes from "@/routers/question/mod.ts";
import { ExamQuestionType } from "@/dto.ts";
import { prepareUniqueUser } from "#test/fixtures/user.ts";
import { createQuestion, updateQuestion } from "#test/utils/question.ts";

beforeEach<Context>(async ({ hono }) => {
  questionRoutes.apply(hono);
});
test("创建单选题题时，选项符号题目类型", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const base = { question_type: ExamQuestionType.SingleChoice, explanation_text: "解释", question_text: "问题" };
  await expect(
    createQuestion(api, alice.token, {
      ...base,
      options: [{ text: "选项1" }],
      answer_index: [0],
    }),
    "单选题至少有两个选项",
  ).responseStatus(400);

  await expect(
    createQuestion(api, alice.token, {
      ...base,
      options: [{ text: "选项1" }, { text: "选项1" }, { text: "选项1" }],
      answer_index: [10],
    }),
    "答案索引超出 options 范围时应返回 400",
  ).responseStatus(400);

  await expect(
    createQuestion(api, alice.token, {
      ...base,
      options: [{ text: "选项1" }, { text: "选项1" }, { text: "选项1" }],
      answer_index: [0, 1],
    }),
    "单选题存在多个正确答案时应返回 400",
  ).responseStatus(400);
  await expect(
    createQuestion(api, alice.token, {
      ...base,
      options: [{ text: "选项1" }, { text: "选项1" }, { text: "选项1" }],
      answer_index: [],
    }),
    "单选题答案不能为空",
  ).responseStatus(400);
});
test("创建多选题题时，选项符号题目类型", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const base = { question_type: ExamQuestionType.MultipleChoice, explanation_text: "解释", question_text: "问题" };
  await expect(
    createQuestion(api, alice.token, {
      ...base,
      options: [{ text: "选项1" }, { text: "选项1" }],
      answer_index: [0, 1],
    }),
    "多选题至少有3个选项",
  ).responseStatus(400);

  await expect(
    createQuestion(api, alice.token, {
      ...base,
      options: [{ text: "选项1" }, { text: "选项1" }, { text: "选项1" }],
      answer_index: [0, 4],
    }),
    "答案索引超出 options 范围时应返回 400",
  ).responseStatus(400);

  await expect(
    createQuestion(api, alice.token, {
      ...base,
      options: [{ text: "选项1" }, { text: "选项1" }, { text: "选项1" }],
      answer_index: [],
    }),
    "多选题答案不能为空",
  ).responseStatus(400);
});
test("创建判断题时，选项符号题目类型", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");
  const base = { question_type: ExamQuestionType.TrueOrFalse, explanation_text: "解释", question_text: "问题" };
  await expect(
    createQuestion(api, alice.token, {
      ...base,
      options: [{ text: "选项1" }, { text: "选项1" }, { text: "选项1" }],
      answer_index: [2],
    }),
    "答案只能为 0 或 1",
  ).responseStatus(400);

  await expect(
    createQuestion(api, alice.token, {
      ...base,
      options: [{ text: "选项1" }, { text: "选项1" }, { text: "选项1" }],
      answer_index: [0, 1],
    }),
    "答案只能为 0 或 1",
  ).responseStatus(400);
  await expect(
    createQuestion(api, alice.token, {
      ...base,
      options: [{ text: "选项1" }, { text: "选项1" }, { text: "选项1" }],
      answer_index: [],
    }),
    "答案不能为空",
  ).responseStatus(400);
});

test("更新单选题选项时，选项符号题目类型", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const { question_id } = await createQuestion(api, alice.token, {
    question_type: ExamQuestionType.SingleChoice,
    answer_index: [0],
    options: [{ text: "选项1" }, { text: "选项2" }],
    explanation_text: "解释",
    question_text: "问题",
  });
  const base = { api, questionId: question_id, token: alice.token };
  await expect(updateQuestion({ ...base, body: { answer_index: [0, 1] } }), "单选题只能有一个答案").responseStatus(400);

  await expect(updateQuestion({ ...base, body: { answer_index: [2] } }), "单选题答案选项不能超过范围").responseStatus(
    400,
  );
});
test("更新判断题选项时，选项符号题目类型", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const { question_id } = await createQuestion(api, alice.token, {
    question_type: ExamQuestionType.TrueOrFalse,
    answer_index: [0],
    explanation_text: "解释",
    question_text: "问题",
  });
  const base = { api, questionId: question_id, token: alice.token };
  await expect(updateQuestion({ ...base, body: { answer_index: [0, 1] } }), "判断题只能有一个答案").responseStatus(400);

  await expect(updateQuestion({ ...base, body: { answer_index: [2] } }), "判断题答案选项不能超过范围").responseStatus(
    400,
  );
  await expect(
    updateQuestion({ ...base, body: { answer_index: [2], options: [{ text: "hh" }] } }),
    "判断题答不应设置选项",
  ).responseStatus(400);
});
test("更新多选题选项时，选项符号题目类型", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const { question_id } = await createQuestion(api, alice.token, {
    question_type: ExamQuestionType.MultipleChoice,
    answer_index: [0, 1],
    options: [{ text: "选项1" }, { text: "选项2" }, { text: "选项3" }],
    explanation_text: "解释",
    question_text: "问题",
  });
  const base = { api, questionId: question_id, token: alice.token };
  await expect(updateQuestion({ ...base, body: { answer_index: [3] } }), "多选题至少有两个答案").responseStatus(400);

  await expect(updateQuestion({ ...base, body: { answer_index: [10] } }), "多选题答案选项不能超过范围").responseStatus(
    400,
  );
  await expect(
    updateQuestion({ ...base, body: { options: [{ text: "选项1" }, { text: "选项1" }] } }),
    "多选题至少有3个选项",
  ).responseStatus(400);

  await expect(updateQuestion({ ...base, body: { answer_index: [] } }), "多选题答案不能为空").responseStatus(400);
});

test("创建题目时，option 附件必须为 base64编码", async function ({ api, publicDbPool }) {
  const alice = await prepareUniqueUser("alice");

  const base = {
    question_type: ExamQuestionType.MultipleChoice,
    explanation_text: "解释",
    question_text: "问题",
    answer_index: [3],
    options: [{ text: "选项1" }, { text: "选项1" }, { text: "选项1" }],
  };
  await expect(
    createQuestion(api, alice.token, { ...base, attachments: [{ file: { type: "text/plain", data: "data" } }] }),
    "option 附件必须为 base64编码",
  ).responseStatus(400);
  await expect(
    createQuestion(api, alice.token, {
      ...base,
      attachments: [{ file: { type: "text", data: encodeURIComponent("data") } }],
    }),
    "type 必须符合 mime type 格式",
  ).responseStatus(400);
});

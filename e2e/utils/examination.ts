import { ExamQuestionType } from "@ijia/api-types";
import type { PrepareExaminationInput, TemplateQuestionInput } from "@ijia/api-types/test";
import { getAppURLFromRoute } from "@/utils/app.ts";
import { api, JWT_TOKEN_KEY } from "@/utils/fetch.ts";

export const DEFAULT_QUESTIONS: TemplateQuestionInput[] = [
  { answer_index: [0], question_type: ExamQuestionType.SingleChoice },
  { answer_index: [1], question_type: ExamQuestionType.SingleChoice },
  { answer_index: [2], question_type: ExamQuestionType.SingleChoice },
];

export function getExamTitle(name: string) {
  return `e2e-${name}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function getExaminationURL(examId?: string | number) {
  return examId === undefined ? getAppURLFromRoute("/examination") : getAppURLFromRoute(`/examination/${examId}`);
}

export function getExaminationAnswerURL(examId: string | number) {
  return getAppURLFromRoute(`/examination/${examId}/answer`);
}

export function prepareExaminationTemplate(questions: TemplateQuestionInput[], options: { ownerId?: number } = {}) {
  return api["/test/template/prepare"].post({
    body: { questions, ownerId: options.ownerId },
  });
}

export async function prepareExamination(input: PrepareExaminationInput) {
  const { number } = await api["/test/examination/prepare"].post({
    body: input,
  });
  return number;
}

export async function prepareUserExamination(
  userId: number,
  name: string,
  questions: TemplateQuestionInput[] = DEFAULT_QUESTIONS,
  input: Omit<PrepareExaminationInput, "userId" | "title" | "templateId"> = {},
) {
  const title = getExamTitle(name);
  const { templateId } = await prepareExaminationTemplate(questions, { ownerId: userId });
  const examinationId = await prepareExamination({
    userId,
    templateId,
    title,
    ...input,
  });

  return { examinationId, templateId, title };
}

export function startExamination(token: string, examId: string | number) {
  return api["/examination/:exam_id/start"].post({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export function nextExaminationQuestion(token: string, examId: string | number) {
  return api["/examination/:exam_id/next"].post({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export function answerExaminationQuestion(token: string, examId: string | number, index: number, answer: number[]) {
  return api["/examination/:exam_id/answer"].post({
    params: { exam_id: examId.toString() },
    body: { index, answer },
    [JWT_TOKEN_KEY]: token,
  });
}

export async function answerNextExaminationQuestion(token: string, examId: string | number, answer: number[]) {
  const { question } = await nextExaminationQuestion(token, examId);
  if (!question) throw new Error("考试已无可作答题目");
  await answerExaminationQuestion(token, examId, question.index, answer);
  return question;
}

export function endExamination(token: string, examId: string | number) {
  return api["/examination/:exam_id/end"].post({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

export function getExaminationResult(token: string, examId: string | number) {
  return api["/examination/:exam_id/result"].get({
    params: { exam_id: examId.toString() },
    [JWT_TOKEN_KEY]: token,
  });
}

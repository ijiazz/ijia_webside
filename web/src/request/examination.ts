import type { ExaminationAnswerInput, ExaminationCreateInput, ExaminationDeleteInput } from "@/api.ts";
import { api } from "./client.ts";

export const EXAMINATION_QUERY_KEY_PREFIX = "examination";

export function getExaminationDetailQueryOption(examId: string) {
  return {
    queryKey: [EXAMINATION_QUERY_KEY_PREFIX, "detail", examId],
    queryFn: () => api["/examination/:exam_id"].get({ params: { exam_id: examId } }),
  };
}

export function getExaminationRecordQueryOption(examId: string) {
  return {
    queryKey: [EXAMINATION_QUERY_KEY_PREFIX, "record", examId],
    queryFn: () => api["/examination/:exam_id/record"].get({ params: { exam_id: examId } }),
  };
}

export function getExaminationResultQueryOption(examId: string) {
  return {
    queryKey: [EXAMINATION_QUERY_KEY_PREFIX, "result", examId],
    queryFn: () => api["/examination/:exam_id/result"].get({ params: { exam_id: examId } }),
  };
}
export function nextExaminationQuestionQueryOption(examId: string) {
  return {
    queryKey: [EXAMINATION_QUERY_KEY_PREFIX, "next", examId],
    queryFn: () => api["/examination/:exam_id/next"].post({ params: { exam_id: examId } }),
  };
}

export function createExamination(input: ExaminationCreateInput) {
  return api["/examination"].put({ body: input });
}

export function deleteExamination(examId: string, body: ExaminationDeleteInput = {}) {
  return api["/examination/:exam_id"].delete({ params: { exam_id: examId }, body });
}

export function startExamination(examId: string) {
  return api["/examination/:exam_id/start"].post({ params: { exam_id: examId } });
}

export function answerExaminationQuestion(examId: string, body: ExaminationAnswerInput) {
  return api["/examination/:exam_id/answer"].post({ params: { exam_id: examId }, body });
}

export function endExamination(examId: string) {
  return api["/examination/:exam_id/end"].post({ params: { exam_id: examId } });
}

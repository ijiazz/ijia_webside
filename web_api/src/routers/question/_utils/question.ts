import { HttpError } from "@/common/errors.ts";

export function parseCursorId(cursor: string) {
  const idNumber = Number.parseInt(cursor);
  if (Number.isSafeInteger(idNumber)) {
    return idNumber;
  }
  throw new HttpError(400, "Invalid cursor");
}
export function toCursor(question_id: string) {
  return question_id;
}
export type QuestionMediaRaw = {
  index: number;
  text: string | null;
  data: string | null;
  type: string | null;
};

function initQuestionOption(raw: QuestionMediaRaw) {
  return {
    text: raw.text ?? undefined,
    file: raw.data && raw.type ? { data: raw.data, type: raw.type } : undefined,
  };
}
export function initQuestionOptions(raws?: QuestionMediaRaw[] | null) {
  if (!raws) return undefined;
  return raws.sort((a, b) => a.index - b.index).map(initQuestionOption);
}

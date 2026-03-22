import { QuestionPublic, QuestionAttachment, QuestionOption } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";

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

export function genQuestionMedias(mediasRaw: QuestionMediaRaw[]) {
  const attachments: QuestionPublic["attachments"] = [];
  const options: QuestionPublic["options"] = [];

  let option: QuestionAttachment | QuestionOption;

  for (const t of mediasRaw) {
    option = {
      file: t.data && t.type ? { data: t.data, type: t.type } : undefined,
      text: t.text ?? undefined,
    };
    if (t.index >= 0) {
      options[t.index] = option;
    } else {
      attachments[-t.index - 1] = option;
    }
  }
  return { attachments, options };
}

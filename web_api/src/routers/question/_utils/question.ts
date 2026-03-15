import { MediaType, QuestionPublic, QuestionMedia } from "@/dto.ts";
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
  title: string | null;
  type: MediaType;
  url: string;
};

export function genQuestionMedias(mediasRaw: QuestionMediaRaw[], optionsText: string[]) {
  const medias: QuestionPublic["medias"] = [];
  const options: QuestionPublic["options"] = new Array(optionsText.length);

  let media: QuestionMedia;

  for (const t of mediasRaw) {
    media = {
      origin: {
        url: t.url,
        meta: undefined,
      },
      type: t.type as MediaType.audio | MediaType.image,
      title: t.title || undefined,
    };
    if (t.index >= 0) {
      options[t.index] = { media, text: optionsText[t.index] };
    } else {
      medias.push(media);
    }
  }
  return { medias, options };
}

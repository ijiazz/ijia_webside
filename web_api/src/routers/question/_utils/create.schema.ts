import { array, enumType, ExpectType, optional } from "@asla/wokao";
import { TEXT_STRUCT_SCHEMA } from "@/global/schema.ts";
import { CreateQuestionParam, ExamQuestionType, MediaType, QuestionMediaUpdate } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";

export const QUESTION_MEDIA_UPDATE_SCHEMA = {
  title: optional.string,
  uri: "string",
  type: enumType([MediaType.image, MediaType.audio] as const),
} satisfies ExpectType;

export const CREATE_QUESTION_PARAM_SCHEMA = {
  question_text: "string",
  question_text_struct: optional(TEXT_STRUCT_SCHEMA),
  question_type: enumType([
    ExamQuestionType.MultipleChoice,
    ExamQuestionType.SingleChoice,
    ExamQuestionType.TrueOrFalse,
  ]),
  options: array({
    text: "string",
    media: optional(QUESTION_MEDIA_UPDATE_SCHEMA),
    is_answer: optional.boolean,
  }),
  question_medias: optional(array(QUESTION_MEDIA_UPDATE_SCHEMA)),
  answer_index: array("number"),
  explanation_text: "string",
  explanation_text_struct: optional(TEXT_STRUCT_SCHEMA),
  event_time: optional.string,
  long_time: optional.boolean,
  themes: optional(array("string")),
} satisfies ExpectType;

export function checkQuestionOption(questionType: ExamQuestionType, options: string[], answerIndex: number[]) {
  switch (questionType) {
    case ExamQuestionType.MultipleChoice: {
      if (answerIndex.length < 2) {
        throw new HttpError(400, "多选题至少要有两个正确选项");
      }
      break;
    }
    case ExamQuestionType.SingleChoice: {
      if (answerIndex.length !== 1) {
        throw new HttpError(400, "单选题有且仅有一个正确选项");
      }
      break;
    }
    case ExamQuestionType.TrueOrFalse: {
      if (options.length !== 2) {
        throw new HttpError(400, "判断题必须有两个选项");
      }
      if (answerIndex.length !== 1) {
        throw new HttpError(400, "判断题有且仅有一个正确选项");
      }
      break;
    }
    default:
      throw new HttpError(400, "未知的题目类型");
  }
}
export function parserCreateQuestionInput(
  options: CreateQuestionParam["options"],
  questionMedias?: QuestionMediaUpdate[] | null,
) {
  const medias: {
    index: number;
    title?: string | null;
    filename: string;
    type: MediaType.audio | MediaType.image;
  }[] = [];
  const answerIndex = new Array<number>();

  const option_text: string[] = new Array(options.length);
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    if (option.is_answer) {
      answerIndex.push(i);
    }
    option_text[i] = option.text;
    const media = option.media;
    if (media) {
      medias.push({
        index: i,
        title: media.title,
        filename: media.uri,
        type: media.type,
      });
    }
  }
  if (questionMedias) {
    for (const media of questionMedias) {
      medias.push({
        index: -1,
        title: media.title,
        filename: media.uri,
        type: media.type,
      });
    }
  }
  return { option_text, medias, answerIndex };
}

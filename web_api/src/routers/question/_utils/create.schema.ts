import { array, checkTypeCopy, ExpectType, InferExpect, optional, CheckTypeError } from "@asla/wokao";
import { CreateQuestionParam, ExamQuestionType, QuestionAttachment, QuestionOption } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";

export const ADVANCED_CONFIG_SCHEMA = {
  long_time: optional.boolean,
  themes: optional(array("string")),
  difficulty_level: optional.number,
  collection_level: optional.number,
};
export type QuestionAdvancedConfig = Partial<InferExpect<typeof ADVANCED_CONFIG_SCHEMA>>;
export const QUESTION_MEDIA_UPDATE_SCHEMA = ((input) => {
  const value = checkTypeCopy(input, {
    text: optional.string,
    file: optional({
      data: "string",
      type: "string",
    }),
  });
  if (!value.file || value.text) {
    if (!value.text || value.file) {
      throw new CheckTypeError("选项必须至少有文本或文件");
    }
  }
  return value;
}) satisfies ExpectType;

/**
 * 检查题目类型和选项的合法性
 */
export function checkQuestionTypeOption(questionType: ExamQuestionType, optionsLength: number, answerIndex: number[]) {
  if (
    questionType !== ExamQuestionType.TrueOrFalse &&
    answerIndex[0] >= 0 &&
    answerIndex[answerIndex.length - 1] >= optionsLength
  ) {
    throw new HttpError(400, "答案选项索引超出范围");
  }
  const answerLength = answerIndex.length;
  switch (questionType) {
    case ExamQuestionType.MultipleChoice: {
      if (optionsLength < 3) {
        throw new HttpError(400, "多选题至少要有3个选项");
      }
      if (answerLength <= 1) {
        throw new HttpError(400, "多选题至少要有1个正确选项");
      }
      break;
    }
    case ExamQuestionType.SingleChoice: {
      if (answerLength !== 1) {
        throw new HttpError(400, "单选题有且仅有一个正确选项");
      }
      if (optionsLength < 2) {
        throw new HttpError(400, "单选题至少有两个选项");
      }
      break;
    }
    case ExamQuestionType.TrueOrFalse: {
      if (optionsLength !== 0) {
        throw new HttpError(400, "判断题不应设置选项");
      }
      if (answerLength !== 1) {
        throw new HttpError(400, "判断题有且仅有一个正确选项");
      }
      break;
    }
    default:
      throw new HttpError(400, "未知的题目类型");
  }
}
export function parserUpdateQuestionInput(
  inputOptions?: CreateQuestionParam["options"],
  inputAttachments?: CreateQuestionParam["attachments"],
) {
  const deleteIndex: number[] = [];
  const options: (QuestionOption & { index: number })[] = [];
  const attachments: (QuestionAttachment & { index: number })[] = [];

  if (inputAttachments) {
    for (const [key, value] of Object.entries(inputAttachments)) {
      let index = Number.parseInt(key);
      if (!Number.isSafeInteger(index)) {
        throw new HttpError(400, "选项索引必须是整数");
      }
      if (index < 0) {
        throw new HttpError(400, "附件索引必须是非负整数");
      }
      index = index * -1 - 1;
      if (value === null) {
        deleteIndex.push(index);
      } else {
        attachments.push({
          file: value.file,
          text: value.text,
          index,
        });
      }
    }
  }
  if (inputOptions) {
    for (const [key, value] of Object.entries(inputOptions)) {
      const index = Number.parseInt(key);
      if (!Number.isSafeInteger(index)) {
        throw new HttpError(400, "选项索引必须是整数");
      }
      if (index < 0) {
        throw new HttpError(400, "选项索引必须是非负整数");
      }
      if (value === null) {
        deleteIndex.push(index);
      } else {
        options.push({
          file: value.file,
          text: value.text,
          index,
        });
      }
    }
  }
  return { deleteIndex, options, attachments };
}
export type QuestionParsedOption = QuestionOption & { index: number };
export function parserCreateQuestionInput(
  inputOptions?: CreateQuestionParam["options"],
  inputAttachments?: CreateQuestionParam["attachments"],
) {
  const total = (inputAttachments?.length ?? 0) + (inputOptions?.length ?? 0);
  const options: QuestionParsedOption[] = new Array(total);
  let offset = 0;
  if (inputAttachments) {
    for (let i = 0; i < inputAttachments.length; i++) {
      const value = inputAttachments[i];
      const index = i * -1 - 1;
      options[offset++] = {
        file: value.file,
        text: value.text,
        index,
      };
    }
  }
  if (inputOptions) {
    for (let i = 0; i < inputOptions.length; i++) {
      const value = inputOptions[i];
      options[offset++] = {
        file: value.file,
        text: value.text,
        index: i,
      };
    }
  }

  return options;
}

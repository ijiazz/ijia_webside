import { UpdateQuestionParam } from "@/dto.ts";
import { parserCreateQuestionInput } from "../_utils/create.schema.ts";
import { v } from "@/sql/utils.ts";
import { update } from "@asla/yoursql";

export async function updateQuestion(questionId: number, userId: number, input: UpdateQuestionParam) {
  const { themes, options, question_medias, add_options, add_medias } = input;

  // 如果是审核中或审核不通过，则直接改
  // 如果是审核通过，则提交要改的参数
  const { option_text, medias, answerIndex } = parserCreateQuestionInput(add_options, add_medias);

  update("exam_question")
    .set({
      question_text: input.question_text === undefined ? undefined : v(input.question_text),
      question_text_struct: input.question_text_struct === undefined ? undefined : v(input.question_text_struct),
      answer_text: input.explanation_text === undefined ? undefined : v(input.explanation_text),
      answer_text_struct: input.explanation_text_struct === undefined ? undefined : v(input.explanation_text_struct),
      event_time: input.event_time === undefined ? undefined : v(input.event_time),
      long_time: input.long_time === undefined ? undefined : v(input.long_time),
    })
    .where(`id=${v(questionId)} AND user_id=${v(userId)}`);
}

import routeGroup from "../_route.ts";
import { createQuestion, DbCreateExamQuestion } from "../_sql/question_create.sql.ts";
import { checkValueAsync } from "@/common/check.ts";
import {
  ADVANCED_CONFIG_SCHEMA,
  checkQuestionTypeOption,
  parserCreateQuestionInput,
  QUESTION_MEDIA_UPDATE_SCHEMA,
} from "../_utils/create.schema.ts";
import { array, enumType, ExpectType, optional } from "@asla/wokao";
import { TEXT_STRUCT_SCHEMA } from "@/common/schema.ts";
import { CreateQuestionParam, ExamQuestionType } from "@/dto.ts";
import { HttpError } from "@/common/errors.ts";
import { ReviewStatus, TextStructure } from "@ijia/school-db/db";

const CREATE_QUESTION_PARAM_SCHEMA = {
  question_text: "string",
  question_text_struct: optional(TEXT_STRUCT_SCHEMA),
  explanation_text: "string",
  explanation_text_struct: optional(TEXT_STRUCT_SCHEMA),

  answer_index: array("number"),
  event_time: optional.string,

  question_type: enumType([
    ExamQuestionType.MultipleChoice,
    ExamQuestionType.SingleChoice,
    ExamQuestionType.TrueOrFalse,
  ]),
  attachments: optional(array(QUESTION_MEDIA_UPDATE_SCHEMA)),
  options: optional(array(QUESTION_MEDIA_UPDATE_SCHEMA)),
  advanced_config: optional(ADVANCED_CONFIG_SCHEMA),
} satisfies ExpectType;

export default routeGroup.create({
  method: "PUT",
  routePath: "/question/entity",
  async validateInput(ctx) {
    const userInfo = await ctx.get("userInfo");
    const userId = await userInfo.getUserId();
    const body = await checkValueAsync(ctx.req.json(), CREATE_QUESTION_PARAM_SCHEMA);

    return { userId, body };
  },
  async handler({ userId, body }, ctx): Promise<{ question_id: string }> {
    // const userInfo = await ctx.get("userInfo");
    // const isAdmin = await userInfo.hasRolePermission(Role.Admin);
    const isAdmin = false; //TODO: 超级管理员创建题目免审核
    if (body.advanced_config && !isAdmin) {
      throw new HttpError(400, "只有管理员才能设置高级配置");
    }
    const questionId = await createQuestionFromInput({ user_id: userId, skipReview: isAdmin }, body);
    return { question_id: questionId.toString() };
  },
});

async function createQuestionFromInput(
  config: { skipReview: boolean; user_id: number },
  input: CreateQuestionParam,
): Promise<number> {
  const { advanced_config = {}, options, attachments } = input;

  const attachmentOptions = parserCreateQuestionInput(options, attachments);
  const answer_index = input.answer_index.sort((a, b) => a - b);

  checkQuestionTypeOption(input.question_type, options?.length ?? 0, answer_index);

  const updateObject: DbCreateExamQuestion = {
    question_text: input.question_text,
    question_text_struct: input.question_text_struct as TextStructure[] | null | undefined,
    question_type: input.question_type,
    answer_index: answer_index,
    answer_text: input.explanation_text,
    answer_text_struct: input.explanation_text_struct as TextStructure[] | null | undefined,
    event_time: input.event_time,

    user_id: config.user_id,
    review_status: config.skipReview ? ReviewStatus.passed : ReviewStatus.pending,

    long_time: advanced_config.long_time,
    difficulty_level: advanced_config.difficulty_level,
    collection_level: advanced_config.collection_level,
  };

  return createQuestion(updateObject, {
    themes: advanced_config?.themes,
    attachmentOptions,
  });
}

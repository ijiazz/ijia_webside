import routeGroup from "../_route.ts";
import { createQuestion } from "../_sql/question_create.sql.ts";
import { checkValueAsync } from "@/global/check.ts";
import { ADVANCED_CONFIG_SCHEMA, QUESTION_MEDIA_UPDATE_SCHEMA } from "../_utils/create.schema.ts";
import { array, enumType, ExpectType, optional } from "@asla/wokao";
import { TEXT_STRUCT_SCHEMA } from "@/global/schema.ts";
import { ExamQuestionType } from "@/dto.ts";
import { Role } from "@/middleware/auth.ts";
import { HttpError } from "@/global/errors.ts";

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
    const userInfo = await ctx.get("userInfo");
    const isAdmin = await userInfo.hasRolePermission(Role.Admin);
    if (body.advanced_config && !isAdmin) {
      throw new HttpError(400, "只有管理员才能设置高级配置");
    }
    const questionId = await createQuestion(userId, body, { skipReview: isAdmin });
    return { question_id: questionId.toString() };
  },
});

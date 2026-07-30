import { checkValueAsync, optionalInt } from "@/common/check.ts";
import { createRoute } from "@/common/context.ts";
import { ExamQuestionType } from "@/dto.ts";
import type { TestExaminationAPI } from "@ijia/api-types/test";
import { array, enumType, ExpectType, optional } from "@asla/wokao";
import { prepareExaminationTemplate } from "../-utils/prepare.ts";

type PrepareTemplateBody = TestExaminationAPI["POST /test/template/prepare"]["body"];
type PrepareTemplateResponse = TestExaminationAPI["POST /test/template/prepare"]["response"];

const PREPARE_TEMPLATE_BODY_SCHEMA = {
  questions: array({
    answer_index: array("number"),
    question_type: enumType([
      ExamQuestionType.MultipleChoice,
      ExamQuestionType.SingleChoice,
      ExamQuestionType.TrueOrFalse,
    ]),
    score: optionalInt,
    option_map: optional(array("number")),
    options: optional(array({ text: optional.string })),
    time_limit: optionalInt,
  }),
  ownerId: optionalInt,
} satisfies ExpectType;

export default createRoute<PrepareTemplateResponse, PrepareTemplateBody>({
  method: "POST",
  routePath: "/test/template/prepare",
  validateInput({ req }) {
    return checkValueAsync(req.json(), PREPARE_TEMPLATE_BODY_SCHEMA);
  },
  handler({ questions, ownerId }) {
    return prepareExaminationTemplate(questions, { ownerId });
  },
});

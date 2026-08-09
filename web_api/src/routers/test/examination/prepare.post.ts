import { checkValueAsync, date } from "@/common/check.ts";
import type { PrepareExaminationInput, TestExaminationAPI } from "@ijia/api-types/test";
import { createRoute } from "@/common/context.ts";
import { ExpectType, integer, optional } from "@asla/wokao";
import {
  createEmptyExamination,
  createExaminationByRules,
  createExaminationByTemplate,
  CreateExaminationOption,
} from "@/routers/examination/mod.ts";

type PrepareExaminationBody = TestExaminationAPI["POST /test/examination/prepare"]["body"];
type PrepareExaminationResponse = TestExaminationAPI["POST /test/examination/prepare"]["response"];

const PREPARE_EXAMINATION_BODY_SCHEMA = {
  userId: integer.positive,
  allowTimeStart: optional(date),
  allowTimeEnd: optional(date),
  resultAllowViewDate: optional(date),
  useTimeTotalLimit: optional.number,
  title: optional.string,
  templateId: optional(integer.positive),
  questionTotal: optional.number,
} satisfies ExpectType;

export default createRoute<PrepareExaminationResponse, PrepareExaminationBody>({
  method: "POST",
  routePath: "/test/examination/prepare",
  validateInput({ req }) {
    return checkValueAsync(req.json(), PREPARE_EXAMINATION_BODY_SCHEMA);
  },
  async handler(input) {
    const number = await prepareExamination(input);
    return { number };
  },
});
async function prepareExamination(
  option: Omit<CreateExaminationOption, "title"> & PrepareExaminationInput,
): Promise<number> {
  const { templateId, questionTotal, title = "考试标题", ...rest } = option;
  if (typeof templateId === "number") {
    const id = await createExaminationByTemplate(templateId, { title, ...rest });
    if (typeof id !== "number") throw new Error("Failed to create examination by template");
    return id;
  } else if (typeof questionTotal === "number") {
    const id = await createExaminationByRules(
      { title, ...rest },
      {
        rules: {
          rules: [{ number: questionTotal, score: 2 }],
          question_total: questionTotal,
          score_total: questionTotal * 2,
        },
        ownerId: rest.userId,
      },
    );
    if (typeof id !== "number") throw new Error("Failed to create examination by question total");
    return id;
  } else {
    return createEmptyExamination({ title, ...rest });
  }
}

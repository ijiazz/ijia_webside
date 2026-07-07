import { checkValueAsync, queryInt } from "@/common/check.ts";
import routeGroup from "./_route.ts";
import { createExaminationByQuestionTotal } from "./_sql/examination_create.sql.ts";
import { ExpectType, optional } from "@asla/wokao";
import { HttpError } from "@/common/errors.ts";
const CreateExaminationInputSchema = {
  allowTimeStart: optional.string,
  allowTimeEnd: optional.string,
  resultAllowViewDate: optional.string,
  useTimeTotalLimit: optional.number,
} satisfies ExpectType;
const QuestionRulesSchema = {
  number: optional.number,
  score: optional.number,
  timeLimit: optional.number,
} satisfies ExpectType;

const InputSchema = [
  {
    ...CreateExaminationInputSchema,
    template_id: queryInt,
    paperTemplate: optional("undefined"),
  },
  {
    ...CreateExaminationInputSchema,
    paperTemplate: {
      questions: QuestionRulesSchema,
    },
  },
] as const satisfies ExpectType;
export default routeGroup.create({
  method: "PUT",
  routePath: "/examination",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const body = await checkValueAsync(ctx.req.json(), InputSchema);

    return { userId, body };
  },
  async handler({ userId, body }): Promise<{ examination_id: string }> {
    let examinationId: number | undefined;
    const title = "模拟考试";
    if (body.paperTemplate) {
      examinationId = await createExaminationByQuestionTotal({ title, userId }, body.paperTemplate);
    } else {
      throw new HttpError(400, "自定义考试模板未开放");
      // examinationId = await createExaminationByTemplate(body.template_id, { title, userId });
    }

    if (typeof examinationId !== "number") throw new HttpError(500, "创建考试失败");
    return { examination_id: examinationId.toString() };
  },
});

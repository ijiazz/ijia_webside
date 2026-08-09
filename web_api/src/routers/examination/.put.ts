import { checkValueAsync, date, queryInt } from "@/common/check.ts";
import routeGroup from "./_route.ts";
import { createExaminationByRules } from "./_sql/examination_create.sql.ts";
import { ExpectType, optional } from "@asla/wokao";
import { HttpError } from "@/common/errors.ts";
import { PaperTemplateGenRulesInput } from "@ijia/api-types";
import { PaperTemplateGenRules } from "./_utils/question_gen_rules.ts";
const CreateExaminationInputSchema = {
  allowTimeStart: optional(date),
  allowTimeEnd: optional(date),
  resultAllowViewDate: optional(date),
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
      const rules = getRules(body.paperTemplate);
      examinationId = await createExaminationByRules(
        {
          title,
          userId,
          useTimeTotalLimit: typeof body.useTimeTotalLimit === "number" ? body.useTimeTotalLimit * 1000 : undefined,
          allowTimeEnd: body.allowTimeEnd,
          allowTimeStart: body.allowTimeStart,
          resultAllowViewDate: body.resultAllowViewDate,
        },
        { rules, ownerId: userId },
      );
    } else {
      throw new HttpError(400, "自定义考试模板未开放");
      // examinationId = await createExaminationByTemplate(body.template_id, { title, userId });
    }

    if (typeof examinationId !== "number") throw new HttpError(500, "创建考试失败");
    return { examination_id: examinationId.toString() };
  },
});
const DEFAULT_SCORE = 2;
function getRules(templateRules: PaperTemplateGenRulesInput): PaperTemplateGenRules {
  if (templateRules.questions) {
    const total = templateRules.questions.number ?? 100;
    return {
      question_total: total,
      score_total: (templateRules.questions.score ?? DEFAULT_SCORE) * total,
      rules: [
        {
          number: total,
          score: templateRules.questions.score ?? DEFAULT_SCORE,
          timeLimit: templateRules.questions.timeLimit,
        },
      ],
    };
  }
  if (templateRules.questionByType) {
    const rules: PaperTemplateGenRules["rules"] = [];
    let total = 0;
    let score_total = 0;
    for (const [type, rule] of Object.entries(templateRules.questionByType)) {
      if (!rule) continue;
      const number = rule.number ?? 10;
      const score = rule.score ?? DEFAULT_SCORE;
      total += number;
      score_total += number * score;
      rules.push({
        number,
        score,
        timeLimit: rule.timeLimit,
        type: type as any,
      });
    }
    return {
      question_total: total,
      score_total,
      rules,
    };
  }
  throw new HttpError(400, "考试模板规则不合法");
}

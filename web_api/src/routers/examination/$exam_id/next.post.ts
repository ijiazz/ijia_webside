import { checkValue, queryInt } from "@/common/check.ts";
import routeGroup from "../_route.ts";
import { getNextExaminationQuestion } from "../_sql/examination_next.sql.ts";
import { ExaminationQuestionOutput } from "@ijia/api-types";

export default routeGroup.create({
  method: "POST",
  routePath: "/examination/:exam_id/next",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const examId = checkValue(ctx.req.param("exam_id"), queryInt);
    return { userId, examId };
  },
  async handler({ userId, examId }): Promise<ExaminationQuestionOutput> {
    const question = await getNextExaminationQuestion(examId, userId);
    return { question };
  },
});

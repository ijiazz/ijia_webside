import { checkValue, checkValueAsync, queryInt } from "@/common/check.ts";
import routeGroup from "../../_route.ts";
import { array } from "@asla/wokao";
import { submitExaminationAnswer } from "../../_sql/examination_answer.sql.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/examination/:exam_id/answer",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const examId = checkValue(ctx.req.param("exam_id"), queryInt);
    const body = await checkValueAsync(ctx.req.json(), {
      index: "number",
      answer: array("number"),
    });
    return { userId, examId, body };
  },
  async handler({ userId, examId, body }) {
    await submitExaminationAnswer(examId, userId, body);
  },
});

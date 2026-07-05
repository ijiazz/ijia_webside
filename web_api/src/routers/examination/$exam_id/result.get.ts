import { checkValue, queryInt } from "@/common/check.ts";
import routeGroup from "../_route.ts";
import { getExaminationResult } from "../_sql/examination_result.sql.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/examination/:exam_id/result",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const examId = checkValue(ctx.req.param("exam_id"), queryInt);
    return { userId, examId };
  },
  handler({ userId, examId }) {
    return getExaminationResult(examId, userId);
  },
});

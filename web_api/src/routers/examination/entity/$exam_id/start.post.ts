import { checkValue, queryInt } from "@/common/check.ts";
import routeGroup from "../../_route.ts";
import { startExamination } from "../../_sql/examination_start.sql.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/examination/:exam_id/start",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const examId = checkValue(ctx.req.param("exam_id"), queryInt);
    return { userId, examId };
  },
  async handler({ userId, examId }) {
    await startExamination(examId, userId);
  },
});
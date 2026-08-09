import { checkValue, queryInt } from "@/common/check.ts";
import routeGroup from "../_route.ts";
import { getExaminationRecord } from "../_sql/examination_record.sql.ts";
import { ExaminationRecordOutput } from "@ijia/api-types";

export default routeGroup.create({
  method: "GET",
  routePath: "/examination/:exam_id/record",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const examId = checkValue(ctx.req.param("exam_id"), queryInt);
    return { userId, examId };
  },
  async handler({ userId, examId }): Promise<ExaminationRecordOutput> {
    const result = await getExaminationRecord(examId, userId);
    return { questions: result };
  },
});

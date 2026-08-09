import { checkValue, queryInt } from "@/common/check.ts";
import { HttpError } from "@/common/errors.ts";
import routeGroup from "./_route.ts";
import { deleteExamination } from "./_sql/examination_delete.sql.ts";

export default routeGroup.create({
  method: "DELETE",
  routePath: "/examination/:exam_id",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const examId = checkValue(ctx.req.param("exam_id"), queryInt);
    return { userId, examId };
  },
  async handler({ userId, examId }) {
    const count = await deleteExamination(examId, userId);
    if (!count) {
      throw new HttpError(404, "考试不存在");
    }
  },
});

import { checkValue, queryInt } from "@/common/check.ts";
import { HttpError } from "@/common/errors.ts";
import routeGroup from "./_route.ts";
import { getExaminationList } from "./_sql/examination_list.sql.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/examination/:exam_id",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const examId = checkValue(ctx.req.param("exam_id"), queryInt);
    return { userId, examId };
  },
  async handler({ userId, examId }) {
    const item = await getExaminationList(userId, { id: examId });
    if (!item || item.items.length === 0) {
      throw new HttpError(404, "考试不存在");
    }
    return item.items[0];
  },
});

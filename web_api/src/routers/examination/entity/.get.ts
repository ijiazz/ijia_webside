import { checkValue } from "@/common/check.ts";
import routeGroup from "../_route.ts";
import { getExaminationList } from "../_sql/examination_list.sql.ts";
import { ExaminationStatus } from "@/dto.ts";
import { enumType, optional } from "@asla/wokao";

export default routeGroup.create({
  method: "GET",
  routePath: "/examination",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    const query = checkValue(ctx.req.query(), {
      cursor: optional.string,
      limit: optional.number,
      status: optional(enumType([ExaminationStatus.ongoing, ExaminationStatus.ended, ExaminationStatus.result])),
    });
    return { userId, query };
  },
  handler({ userId, query }) {
    return getExaminationList(userId, query);
  },
});

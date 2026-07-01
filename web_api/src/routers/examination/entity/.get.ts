import { checkValue, optionalInt } from "@/common/check.ts";
import routeGroup from "../_route.ts";
import { getExaminationList } from "../_sql/examination_list.sql.ts";
import { ExaminationStatus } from "@/dto.ts";
import { array, enumType, optional } from "@asla/wokao";
const StatusSchema = array(
  enumType([
    ExaminationStatus.ongoing,
    ExaminationStatus.ended,
    ExaminationStatus.result,
    ExaminationStatus.upcoming,
    ExaminationStatus.ready,
  ]),
);
export default routeGroup.create({
  method: "GET",
  routePath: "/examination",
  async validateInput(ctx) {
    const { req } = ctx;
    const userId = await ctx.get("userInfo").getUserId();
    const status = checkValue(req.queries("status"), optional(StatusSchema));
    const query = checkValue(ctx.req.query(), {
      cursor: optional.string,
      limit: optionalInt,
    });
    return { userId, query: { ...query, status } };
  },
  handler({ userId, query }) {
    return getExaminationList(userId, query);
  },
});

import { checkValue } from "@/global/check.ts";
import { GetListOption } from "@/dto/common.ts";
import { optionalPositiveInt } from "@/global/check.ts";
import { getCommentCount } from "../-sql/comment_stat.ts";

import routeGroup from "../_route.ts";
import { requiredRoles, Role } from "@/middleware/auth.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/live/stat/count_by_user",
  middlewares: [requiredRoles(Role.Root)],
  async validateInput(ctx) {
    const q = ctx.req.queries();
    return checkValue(q, { number: optionalPositiveInt, offset: optionalPositiveInt });
  },
  async handler(option: GetListOption) {
    const list = await getCommentCount(new Date("2023-10-18"), option);

    return { list };
  },
});

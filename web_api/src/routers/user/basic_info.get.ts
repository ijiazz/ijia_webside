import { getUserBasic } from "./-sql/user.service.ts";
import routeGroup from "./_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/user/basic_info",
  async validateInput(ctx) {
    return ctx.get("userInfo").getUserId();
  },
  async handler(userId: number) {
    return getUserBasic(userId);
  },
});

import { getUserBasic } from "./-sql/user.service.ts";
import routeGroup from "./_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/user/basic_info",
  async validateInput(ctx) {
    const jwtInfo = await ctx.get("userInfo").getJwtInfo();
    return +jwtInfo.userId;
  },
  async handler(userId: number) {
    return getUserBasic(userId);
  },
});

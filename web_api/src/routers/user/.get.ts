import { checkValue, optionalInt } from "@/global/check.ts";
import { getUserInfo } from "./-sql/user.service.ts";
import routeGroup from "./_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/user",
  async validateInput(ctx) {
    const { req } = ctx;
    const userId = checkValue(req.query("userId"), optionalInt);
    if (userId !== undefined) {
      return userId;
    }
    const srcUserId = await ctx.get("userInfo").getUserId();
    return srcUserId;
  },
  async handler(userId: number) {
    return getUserInfo(userId);
  },
});

import { UserInfoDto } from "@/dto/user.ts";
import { getUserProfile } from "../-sql/user.service.ts";
import routeGroup from "../_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/user/profile",
  async validateInput(ctx) {
    const jwtInfo = await ctx.get("userInfo").getJwtInfo();
    return +jwtInfo.userId;
  },
  async handler(userId): Promise<UserInfoDto> {
    return getUserProfile(userId);
  },
});

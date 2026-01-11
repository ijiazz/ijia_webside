import { UserInfoDto } from "@/dto.ts";
import { getUserProfile } from "../-sql/user.service.ts";
import routeGroup from "../_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/user/profile",
  async validateInput(ctx) {
    const userId = await ctx.get("userInfo").getUserId();
    return userId;
  },
  async handler(userId): Promise<UserInfoDto> {
    return getUserProfile(userId);
  },
});

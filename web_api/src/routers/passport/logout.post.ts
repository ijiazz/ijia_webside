import routeGroup from "./_route.ts";
import { setCookieAuth } from "./-services/cookie.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/logout",
  async handler(param: undefined, ctx): Promise<void> {
    setCookieAuth(ctx, "", 0);
  },
});

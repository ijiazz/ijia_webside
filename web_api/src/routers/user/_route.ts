import { ENV } from "@/config.ts";
import { HonoContext } from "@/hono/type.ts";
import { RouteGroup } from "@/lib/route.ts";
if (!ENV.IS_PROD) {
  console.warn("非生产环境，账号绑定检测通过数据库检测");
}

const routeGroup = new RouteGroup<HonoContext>();
export default routeGroup;

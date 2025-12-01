import { HonoContext } from "@/hono/type.ts";
import { RouteGroup } from "@/lib/route.ts";
import { setUserInfo } from "@/middleware/auth.ts";

const routeGroup = new RouteGroup<HonoContext>({ middlewares: [setUserInfo] });
export default routeGroup;

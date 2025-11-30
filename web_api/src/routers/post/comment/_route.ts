import { RouteGroup } from "@/lib/route.ts";
import { setUserInfo } from "@/middleware/auth.ts";

const routeGroup = new RouteGroup({ middlewares: [setUserInfo] });

export default routeGroup;

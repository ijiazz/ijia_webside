import { HonoContext, createRoute } from "@/common/context.ts";
import { RouteGroup } from "@/lib/route.ts";
import listRoute from "./list.get.ts";
import putRoute from "./.put.ts";
import deleteRoute from "./$commentId.delete.ts";
import likeRoute from "./$commentId/like.post.ts";
import reportRoute from "./$commentId/report.post.ts";

const routeGroup = new RouteGroup<HonoContext>();

routeGroup.add(listRoute);
routeGroup.add(putRoute);
routeGroup.add(deleteRoute);
routeGroup.add(likeRoute);
routeGroup.add(reportRoute);

export default routeGroup;

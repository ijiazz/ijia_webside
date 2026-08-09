import { RouteGroup } from "@/lib/route.ts";
import prepareExaminationRoute from "./examination/prepare.post.ts";
import prepareTemplateRoute from "./examination/template/prepare.post.ts";
import { HonoContext } from "@/common/context.ts";

const routeGroup = new RouteGroup<HonoContext>();
routeGroup.add(prepareTemplateRoute);
routeGroup.add(prepareExaminationRoute);

export default routeGroup;

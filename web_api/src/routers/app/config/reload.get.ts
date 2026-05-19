import { updateConfig } from "@/config.ts";
import routeGroup from "../_route.ts";
import { requiredRoles } from "@/middleware/auth.ts";
import { Role } from "@/common/userInfo.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/app/config/reload",
  middlewares: [requiredRoles(Role.Root)],
  async handler() {
    await updateConfig();
  },
});

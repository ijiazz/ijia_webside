import { updateConfig } from "@/config.ts";
import routeGroup from "../_route.ts";
import { requiredRoles, Role } from "@/middleware/auth.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/app/config/reload",
  middlewares: [requiredRoles(Role.Root)],
  async handler() {
    await updateConfig();
  },
});

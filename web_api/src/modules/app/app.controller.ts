import { Get, Use } from "@asla/hono-decorator";
import { autoBody } from "@/global/pipe.ts";
import { Role, Roles, rolesGuard } from "@/global/auth.ts";
import { updateConfig } from "@/config.ts";

@Use(rolesGuard)
@autoBody
class AppController {
  @Roles(Role.Root)
  @Get("/app/config/reload")
  async loadConfig() {
    await updateConfig();
  }
}

export const appController = new AppController();

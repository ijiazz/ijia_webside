import { Get, Use } from "@asla/hono-decorator";
import { autoBody } from "@/global/pipe.ts";
import { Role, Roles, identity } from "@/middleware/auth.ts";
import { updateConfig } from "@/config.ts";

@Use(identity)
@autoBody
class AppController {
  @Roles(Role.Root)
  @Get("/app/config/reload")
  async loadConfig() {
    await updateConfig();
  }
}

export const appController = new AppController();

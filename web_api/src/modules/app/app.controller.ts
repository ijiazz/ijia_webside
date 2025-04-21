import { Get, Use } from "@asla/hono-decorator";
import { autoBody } from "@/global/pipe.ts";
import { Role, Roles, rolesGuard } from "@/global/auth.ts";
import { updateConfig } from "@/config.ts";
import { getContributors } from "./sql/contributor.ts";

@Use(rolesGuard)
@autoBody
class AppController {
  @Roles(Role.Root)
  @Get("/app/config/reload")
  async loadConfig() {
    await updateConfig();
  }
  @Get("/app/contributors")
  async getContributors() {
    const items = await getContributors();

    return {
      items,
      total: items.length,
    };
  }
}

export const appController = new AppController();

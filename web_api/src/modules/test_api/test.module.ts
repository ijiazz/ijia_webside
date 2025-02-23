import { getPackageJson } from "@/config/mod.ts";
import { Controller, Get } from "@asla/hono-decorator";

@Controller({ basePath: "test" })
class TestController {
  @Get("version")
  async getVersion(): Promise<{ version: string; commitSha: string; commitDate: string }> {
    const packageJson = await getPackageJson();
    return {
      version: packageJson.version,
      ...packageJson.buildMeta,
    };
  }
}
export const controllers: (new () => any)[] = [TestController];

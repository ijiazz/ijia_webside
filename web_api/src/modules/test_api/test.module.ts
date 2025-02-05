import { getPackageJson } from "@/config/mod.ts";
import { Controller, Get, Module, SetMetadata } from "@nestjs/common";
import { MODULE_PATH } from "@nestjs/common/constants.js";

@Controller()
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

@SetMetadata(MODULE_PATH, "test")
@Module({
  controllers: [TestController],
})
export class TestModule {
  constructor() {}
}

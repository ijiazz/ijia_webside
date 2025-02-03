import packageJson from "@/../package.json" with { type: "json" };
import { Controller, Get, Module, SetMetadata } from "@nestjs/common";
import { MODULE_PATH } from "@nestjs/common/constants.js";

@Controller()
class TestController {
  @Get("version")
  getVersion(): { version: string; commitSha: string; commitDate: string } {
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

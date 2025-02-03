import {} from "@/global/auth.ts";
import { Controller, Get, Module, SetMetadata } from "@nestjs/common";
import { MODULE_PATH } from "@nestjs/common/constants.js";

@Controller()
class TestController {
  @Get("hi")
  use() {
    return "hi";
  }
  @Get("error")
  getError() {
    throw new Error("出错了");
  }
}

@SetMetadata(MODULE_PATH, "test")
@Module({
  controllers: [TestController],
})
export class TestModule {
  constructor() {}
}

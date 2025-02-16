import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { TestModule } from "./test_api/test.module.ts";
import { StatModule } from "./stat/stat.module.ts";
import { RolesMiddleware } from "@/global/auth.ts";
@Module({
  imports: [TestModule, StatModule],
})
export class AppModule implements NestModule {
  constructor() {}
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RolesMiddleware).forRoutes("*");
  }
}

import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TestModule } from "./test_api/test.module.ts";
import { StatModule } from "./stat/stat.module.ts";
import { PermissionsGuard, RolesMiddleware } from "@/global/auth.ts";
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  imports: [TestModule, StatModule],
})
export class AppModule implements NestModule {
  constructor() {}
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RolesMiddleware).forRoutes("*");
  }
}

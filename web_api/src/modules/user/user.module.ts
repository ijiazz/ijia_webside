import { Module } from "@nestjs/common";
import { DataModule } from "../share/data.module.ts";
import { UserController } from "./user.controller.ts";
import { CacheModule } from "../share/cache.module.ts";

@Module({
  controllers: [UserController],
  imports: [DataModule, CacheModule],
})
export class UserModule {
  constructor() {}
}

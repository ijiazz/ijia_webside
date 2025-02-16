import { Module } from "@nestjs/common";
import { DataModule } from "../share/data.module.ts";
import { UserController } from "./user.controller.ts";

@Module({
  controllers: [UserController],
  imports: [DataModule],
})
export class UserModule {
  constructor() {}
}

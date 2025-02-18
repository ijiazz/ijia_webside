import { Module } from "@nestjs/common";
import { DataModule } from "../share/data.module.ts";
import { UserController } from "./user.controller.ts";
import { LoginService } from "./services/Login.service.ts";

@Module({
  controllers: [UserController],
  providers: [LoginService],
  imports: [DataModule],
})
export class UserModule {
  constructor() {}
}

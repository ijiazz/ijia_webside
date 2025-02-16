import { user } from "@ijia/data/db";
import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import type { CreateUserProfileDto, CreateUserProfileResult } from "./user.type.ts";
import { validator } from "@/global/checker.pipe.ts";
import { typeChecker } from "evlib";
const { optional, array } = typeChecker;
@Controller()
export class UserController {
  constructor() {}
  @Post("/user/profile")
  async createUser(
    @Body(
      validator({
        email: "string",
        password: optional.string,
        classId: optional(array.string),
      }),
    )
    body: CreateUserProfileDto,
  ): Promise<CreateUserProfileResult> {
    const result = await user
      .insert({
        email: body.email,
        password: body.password,
      })
      .returning<{ userId: number }>({ userId: "id" })
      .queryRows();
    return result[0];
  }
  @Patch("/user/profile")
  updateUser() {}
  @Get("/user/profile")
  getUser() {}

  @Post("user/login")
  login(body: {}) {}
}

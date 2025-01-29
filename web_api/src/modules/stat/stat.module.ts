import { Module, SetMetadata } from "@nestjs/common";
import { MODULE_PATH } from "@nestjs/common/constants.js";
import { CommentStat } from "./comment_stat.controller.ts";
import { DataModule } from "../share/data.module.ts";

@SetMetadata(MODULE_PATH, "stat")
@Module({
  imports: [DataModule],
  controllers: [CommentStat],
})
export class StatModule {
  constructor() {}
}

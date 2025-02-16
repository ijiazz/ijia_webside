import { Module } from "@nestjs/common";
import { DataModule } from "../share/data.module.ts";
import { RobotController } from "./robot.controller.ts";

@Module({
  controllers: [RobotController],
  imports: [DataModule],
})
export class RobotModule {
  constructor() {}
}

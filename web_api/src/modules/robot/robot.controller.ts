import { Controller, Post } from "@nestjs/common";

@Controller()
export class RobotController {
  @Post("robot/verification_code")
  genVerificationCode() {
  }
}

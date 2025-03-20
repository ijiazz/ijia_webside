import { Controller, Post } from "@asla/hono-decorator";

@Controller({})
export class RobotController {
  @Post("robot/verification_code")
  genVerificationCode() {}
}

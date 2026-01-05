import { ImageCaptchaQuestion } from "@/dto.ts";
import routeGroup from "../_route.ts";
import { imageCaptchaService } from "../-service/ImageCaptcha.service.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/captcha/image",
  validateInput(ctx) {
    const req = ctx.req;
    return req.query("sessionId");
  },
  handler: createImageCaptchaSession,
});

export async function createImageCaptchaSession(sessionId?: string): Promise<ImageCaptchaQuestion> {
  return imageCaptchaService.createSession(sessionId);
}

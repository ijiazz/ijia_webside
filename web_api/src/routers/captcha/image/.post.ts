import { ImageCaptchaQuestion } from "@/dto/captcha.ts";
import routeGroup, { imageCaptchaController } from "../_route.ts";

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
  return imageCaptchaController.createSession(sessionId);
}

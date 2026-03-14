import routeGroup from "../_route.ts";
import { imageCaptchaService } from "../-service/ImageCaptcha.service.ts";
import { HttpError } from "@/global/errors.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/captcha/image/:filepath",
  async validateInput(ctx) {
    const { req } = ctx;
    const filepath = req.param("filepath");
    if (!filepath) throw new HttpError(400, "filepath 不存在");
    return filepath;
  },
  async handler(imageUri: string, ctx): Promise<Response> {
    const { mime, stream } = await imageCaptchaService.getCaptchaImageStream(imageUri);
    ctx.header("Content-Type", mime);
    return ctx.body(stream, 200);
  },
});

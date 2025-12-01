import routeGroup, { imageCaptchaController } from "../_route.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/captcha/image/:filepath",
  async validateInput(ctx) {
    const { req } = ctx;
    return req.param("filepath");
  },
  async handler(imageUri: string, ctx): Promise<Response> {
    const { mime, stream } = await imageCaptchaController.getCaptchaImageStream(imageUri);
    ctx.header("Content-Type", mime);
    return ctx.body(stream, 200);
  },
});

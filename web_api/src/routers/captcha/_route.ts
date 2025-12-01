import { HonoContext } from "@/hono/type.ts";
import { RouteGroup } from "@/lib/route.ts";
import { ImageCaptchaController } from "./-utils/captcha.controller.ts";

const routeGroup = new RouteGroup<HonoContext>({});
export default routeGroup;

export const imageCaptchaController = new ImageCaptchaController();

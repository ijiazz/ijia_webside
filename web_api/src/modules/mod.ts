import { commentStatController } from "./stat/mod.ts";
import { userController } from "./user/mod.ts";
import { imageCaptchaController } from "./captcha/mod.ts";

export const controllers: object[] = [userController, commentStatController, imageCaptchaController];

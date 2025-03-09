import { ImageCaptchaReply } from "@/api.ts";
import { imageCaptchaController } from "@/modules/captcha/ImageCaptcha.controller.ts";
import { captcha_picture, DbCaptchaPictureCreate } from "@ijia/data/db";

export function createCaptcha(max: number): DbCaptchaPictureCreate[] {
  let arr = new Array<DbCaptchaPictureCreate>(max);
  for (let i = 0; i < max; i++) {
    arr[i] = { id: i.toString() };
  }
  return arr;
}
export async function initCaptcha() {
  const captcha = createCaptcha(20);
  let i = 0;
  for (; i < 3; i++) captcha[i].is_true = true;
  for (; i < 6; i++) captcha[i].is_true = false;

  await captcha_picture.insert(captcha).query(); // 前 6 张图片的真假值被确定
}

export async function createCaptchaSession(): Promise<ImageCaptchaReply> {
  const { imageUrlList, sessionId, survivalTime } = await imageCaptchaController.createSession();
  const result = await imageCaptchaController.getAnswer(sessionId);
  return {
    sessionId,
    selectedIndex: result.yes,
  };
}

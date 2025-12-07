import { ImageCaptchaReply } from "@/dto/captcha.ts";
import { imageCaptchaService } from "@/routers/captcha/mod.ts";
import { createImageCaptchaSession } from "@/routers/captcha/mod.ts";
import { insertIntoValues } from "@/sql/utils.ts";
import { captcha_picture, DbCaptchaPictureCreate } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";

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
  await dbPool.execute(insertIntoValues(captcha_picture.name, captcha).onConflict("id").doNotThing()); // 前 6 张图片的真假值被确定
}

export async function createCaptchaSession(): Promise<ImageCaptchaReply> {
  const { imageUrlList, sessionId, survivalTime } = await createImageCaptchaSession();
  const result = await imageCaptchaService.getAnswer(sessionId);
  return {
    sessionId,
    selectedIndex: result.yes,
  };
}

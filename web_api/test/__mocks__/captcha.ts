import { DbCaptchaPictureCreate } from "@ijia/data/db";

export function createCaptcha(max: number): DbCaptchaPictureCreate[] {
  let arr = new Array<DbCaptchaPictureCreate>(max);
  for (let i = 0; i < max; i++) {
    arr[i] = { id: i.toString() };
  }
  return arr;
}

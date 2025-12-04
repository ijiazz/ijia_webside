import { select } from "@asla/yoursql";
import { captcha_picture } from "@ijia/data/db";
import { createQueryableSql } from "@ijia/data/dbclient";

export function getRandomImageCaptcha() {
  const t = select("id, type, is_true").from(captcha_picture.name);
  //TODO: 优化随机行的获取
  //4 张确定值
  const certain = t.where(`is_true IS NOT NULL`).orderBy("RANDOM()").limit(4);
  //5 张不确定值
  const equivocal = t.where(`is_true IS NULL`).orderBy("RANDOM()").limit(9); // limit 9 避免 certain 数量不足

  const sql = `(${certain.toSelect()} UNION ALL ${equivocal.toSelect()}) LIMIT 9`;
  return createQueryableSql<CaptchaRes, CaptchaRes[]>(sql, ({ rows }) => rows.sort(() => Math.random() - 0.5));
}
export type CaptchaRes = {
  id: string;
  type: string | null;
  is_true: boolean | null;
};

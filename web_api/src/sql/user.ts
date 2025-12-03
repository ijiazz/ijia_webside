import { HttpError } from "@/global/errors.ts";
import { user } from "@ijia/data/db";
import { v } from "./utils.ts";
import { select } from "@asla/yoursql";
import { dbPool } from "@ijia/data/dbclient";

/** 从数据库获取有效用户信息 */
export async function getValidUserSampleInfoByUserId(userId: number): Promise<SampleUserInfo> {
  const [info] = await select({ user_id: "id", email: true, nickname: true, is_deleted: true })
    .from(user.name)
    .where([`id=${v(userId)}`])
    .dataClient(dbPool)
    .queryRows();
  if (!info) throw new HttpError(400, "账号不存在");
  if (info.is_deleted) throw new HttpError(423, "账号已被冻结");
  delete info.is_deleted;

  return info as SampleUserInfo;
}

export type SampleUserInfo = {
  user_id: number;
  email: string;
  nickname: string | null;
};

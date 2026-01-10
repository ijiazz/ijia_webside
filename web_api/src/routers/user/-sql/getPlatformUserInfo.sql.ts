import { HttpError } from "@/global/errors.ts";
import { PlatformUserBasicInfoCheckResult } from "@/services/douyin.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { Platform } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { checkSignatureStudentId } from "./user.service.ts";

export async function getPlatformUserInfo(
  platform: Platform,
  pla_uid: string,
  userId: number,
): Promise<PlatformUserBasicInfoCheckResult> {
  let where: string;
  if (platform === Platform.douYin) {
    where = `(extra->>'sec_uid')=${v(pla_uid)}`;
  } else {
    where = `pla_uid=${v(pla_uid)}`;
  }
  const [res] = await dbPool.queryRows(
    select<{
      platform: Platform;
      pla_uid: string;
      signature: string;
      avatar: string;
      user_name: string;
    }>({
      pla_uid: true,
      signature: true,
      avatar: true,
      user_name: true,
      platform: true,
    })
      .from("pla_user")
      .where(where)
      .limit(1),
  );
  if (!res) throw new HttpError(400, { message: "账号不存在" });
  if (!checkSignatureStudentId(userId, res.signature))
    throw new HttpError(403, { message: "审核不通过。没有从账号检测到学号" });
  return {
    pla_uid: res.pla_uid,
    avatarPath: res.avatar,
    description: res.signature,
    username: res.user_name,
    platform: res.platform,
    pass: true,
  };
}

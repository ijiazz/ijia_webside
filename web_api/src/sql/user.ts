import { HttpError, RequiredLoginError } from "@/global/errors.ts";

import { getValidUserSampleInfoByUserId as getUserById, SampleUserInfo } from "@ijia/data/query";

/** 从数据库获取有效用户信息 */
export async function getValidUserSampleInfoByUserId(userId: number): Promise<SampleUserInfo> {
  const user = await getUserById(userId); //从数据库检测用户信息是否失效
  if (!user) {
    throw new RequiredLoginError("账号不存在");
  }
  if (user.is_deleted) {
    throw new HttpError(423, "账号已被冻结");
  }
  return user;
}
export type { SampleUserInfo };

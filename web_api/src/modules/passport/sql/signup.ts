import { user, user_profile } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import { HttpError } from "@/global/errors.ts";
import { hashPasswordBackEnd } from "../services/password.ts";
//TODO 账号注销后重新注册 (is_deleted = true). 需要清除账号数据
export async function createUser(email: string, userInfo: { password?: string; nickname?: string }): Promise<number> {
  const { nickname } = userInfo;
  let password: string | undefined;
  let salt: string | undefined;
  if (typeof userInfo.password === "string") {
    salt = crypto.randomUUID().replaceAll("-", ""); //16byte
    password = await hashPasswordBackEnd(userInfo.password, salt);
  }
  await using conn = await dbPool.begin();
  const insert = user
    .insert({ email, password: password, pwd_salt: salt, nickname })
    .onConflict(["email"])
    .doNotThing()
    .returning<{ user_id: number }>({ user_id: "id" });
  const userId = await conn.queryRows(insert).then((rows): number | undefined => rows[0]?.user_id);
  if (!userId) throw new HttpError(406, "邮箱已注册");

  await conn.queryCount(user_profile.insert({ user_id: userId }));
  await conn.commit();
  return userId;
}

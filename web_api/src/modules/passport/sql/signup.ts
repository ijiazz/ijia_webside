import { HttpError } from "@/global/errors.ts";
import { hashPasswordBackEnd } from "../services/password.ts";
import { createUser as getCreateUserSql } from "@ijia/data/query";

export async function createUser(email: string, userInfo: { password?: string; nickname?: string }): Promise<number> {
  const { nickname } = userInfo;
  let password: string | undefined;
  let salt: string | undefined;
  if (typeof userInfo.password === "string") {
    salt = crypto.randomUUID().replaceAll("-", ""); //16byte
    password = await hashPasswordBackEnd(userInfo.password, salt);
  }
  const [res] = await getCreateUserSql(email, { nickname, password, salt }).queryRows();

  if (!res) throw new HttpError(406, "邮箱已注册");

  return res.user_id;
}

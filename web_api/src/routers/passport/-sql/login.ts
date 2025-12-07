import { dbPool } from "@/db/client.ts";
import { HttpError } from "@/global/errors.ts";
import { hashPasswordBackEnd } from "../-services/password.ts";
import { user, user_blacklist } from "@ijia/data/db";
import { select, update } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";

export async function accountLoginById(id: number, password?: string): Promise<number> {
  const user: LoginUserInfo | undefined = await selectUser(`id=${v(id)}`);
  return loginCheck(user, password);
}
export async function accountLoginByEmail(email: string, password?: string): Promise<number> {
  const user = await selectUser(`email=${v(email)}`);
  return loginCheck(user, password);
}
export async function updateLastLoginTime(id: number) {
  await dbPool.queryCount(
    update(user.name)
      .set({ last_login_time: "now()" })
      .where([`id=${v(id)}`, "last_login_time < now()"]),
  );
}
async function loginCheck(user: LoginUserInfo | undefined, password?: string): Promise<number> {
  if (!user) throw new HttpError(401, { message: "账号或密码错误" });
  if (user.in_blacklist) throw new HttpError(423, { message: "账号已被冻结" });

  const pwdIsEqual = await expectPasswordIsEqual(user, password);
  if (!pwdIsEqual) throw new HttpError(401, { message: "账号或密码错误" });
  return user.user_id;
}
async function expectPasswordIsEqual(user: LoginUserInfo, inputPassword?: string): Promise<boolean> {
  if (!user.password) return true; // 用户没有设置密码，直接登录
  if (!inputPassword) return false; // 用户设置了密码，但没有提供密码
  if (user.pwd_salt) inputPassword = await hashPasswordBackEnd(inputPassword, user.pwd_salt);
  return typeof inputPassword === "string" && user.password === inputPassword;
}
function selectUser(where: string) {
  return dbPool
    .queryRows(
      select<LoginUserInfo>({
        user_id: "id",
        password: true,
        pwd_salt: true,
        in_blacklist: `EXISTS ${select("1").from(user_blacklist.name).where("user_id = u.id").toSelect()}`,
      })
        .from(user.name, { as: "u" })
        .where(["NOT is_deleted", where])
        .limit(1),
    )
    .then((rows) => rows[0]);
}
type LoginUserInfo = {
  user_id: number;
  password: string | null;
  pwd_salt: string | null;
  in_blacklist: boolean;
};

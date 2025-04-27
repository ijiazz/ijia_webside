import v from "@ijia/data/yoursql";
import { HttpError } from "@/global/errors.ts";
import { hashPasswordBackEnd } from "../services/password.ts";
import { user } from "@ijia/data/db";

export async function accountLoginById(id: number, password: string): Promise<number> {
  const user: LoginUserInfo | undefined = await selectUser(`id=${v(id)}`);
  return loginCheck(user, password);
}
export async function accountLoginByEmail(email: string, password: string): Promise<number> {
  const user = await selectUser(`email=${v(email)}`);
  return loginCheck(user, password);
}
export async function updateLastLoginTime(id: number) {
  await user
    .update({ last_login_time: "now()" })
    .where([`id=${v(id)}`, "last_login_time < now()"])
    .queryCount();
}
async function loginCheck(user: LoginUserInfo | undefined, password: string): Promise<number> {
  if (!user) throw new HttpError(401, { message: "账号或密码错误" });

  const pwdIsEqual = await expectPasswordIsEqual(user, password);
  if (!pwdIsEqual) throw new HttpError(401, { message: "账号或密码错误" });
  if (user.login_ban) throw new HttpError(423, { message: "账号已被冻结" });
  return user.user_id;
}
async function expectPasswordIsEqual(user: LoginUserInfo, inputPassword: string): Promise<boolean> {
  if (user.pwd_salt && user.password) {
    inputPassword = await hashPasswordBackEnd(inputPassword, user.pwd_salt);
  }
  return typeof inputPassword === "string" && user.password === inputPassword;
}
function selectUser(where: string) {
  return user
    .select<LoginUserInfo>({
      user_id: "id",
      password: true,
      pwd_salt: true,
      login_ban: "get_bit(status, 0)",
    })
    .where([where, "NOT is_deleted"])
    .limit(1)
    .queryRows()
    .then((items) => items[0]);
}
type LoginUserInfo = {
  user_id: number;
  password?: string;
  pwd_salt?: string;
  login_ban: boolean;
};

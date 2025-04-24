import { user, user_profile } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import { hashPasswordBackEnd } from "./password.ts";
import { HttpError } from "@/global/errors.ts";
function selectUser(where: string) {
  return user
    .select<LoginUserInfo>({
      user_id: "id",
      password: true,
      pwd_salt: true,
      is_deleted: true,
      login_ban: "get_bit(status, 0)",
    })
    .where(where);
}
function getUserById(userId: number): Promise<LoginUserInfo> {
  return selectUser(`id=${v(userId)}`)
    .limit(1)
    .queryRows()
    .then((items) => items[0]);
}
function getUserByEmail(email: string): Promise<LoginUserInfo> {
  return selectUser(`email=${v(email)}`)
    .limit(1)
    .queryRows()
    .then((items) => items[0]);
}
type LoginUserInfo = {
  user_id: number;
  password?: string;
  pwd_salt?: string;
  login_ban: boolean;
  is_deleted: boolean;
};
export class PassportService {
  async loginById(id: number, password: string): Promise<number> {
    const user: LoginUserInfo | undefined = await getUserById(id);
    return loginCheck(user, password);
  }
  async loginByEmail(email: string, password: string): Promise<number> {
    const user = await getUserByEmail(email);
    return loginCheck(user, password);
  }
  async createUser(email: string, userInfo: { password?: string }) {
    let password: string | undefined;
    let salt: string | undefined;
    if (typeof userInfo.password === "string") {
      salt = crypto.randomUUID().replaceAll("-", ""); //16byte
      password = await hashPasswordBackEnd(userInfo.password, salt);
    }
    await using conn = await dbPool.begin();
    const insert = user
      .insert({ email, password: password, pwd_salt: salt })
      .onConflict(["email"])
      .doNotThing()
      .returning<{ user_id: number }>({ user_id: "id" });
    const userId = await conn.queryRows(insert).then((rows): number | undefined => rows[0]?.user_id);
    if (!userId) throw new HttpError(406, "邮箱已注册");

    await conn.queryCount(user_profile.insert({ user_id: userId }));
    await conn.commit();
    return userId;
  }
  async changePasswordVerifyOld(uid: number, oldPwd: string, newPwd: string) {
    const salt = crypto.randomUUID().replaceAll("-", ""); //16byte
    const password = await hashPasswordBackEnd(newPwd, salt);

    await using conn = dbPool.begin("REPEATABLE READ");
    const userInfo: LoginUserInfo | undefined = await conn
      .queryRows(selectUser(`id=${uid}`).limit(1))
      .then((rows) => rows[0]);
    if (!userInfo) throw new HttpError(409, { message: "用户不存在" });

    await expectPasswordIsEqual(userInfo, oldPwd);
    await conn.queryCount(user.update({ password: v(password), pwd_salt: v(salt) }).where(`id=${v(uid)}`));
    await conn.commit();
  }
  async resetPassword(email: string, newPwd: string) {
    const salt = crypto.randomUUID().replaceAll("-", ""); //16byte
    const password = await hashPasswordBackEnd(newPwd, salt);

    const count = await user
      .update({ password: v(password), pwd_salt: v(salt) })
      .where(`email=${v(email)}`)
      .queryCount();
    if (count === 0) {
      throw new HttpError(409, { message: "用户不存在" });
    }
  }
  async changeEmail(userId: number, newEmail: string) {
    const count = await user
      .update({ email: v(newEmail) })
      .where(
        `id=${v(userId)} AND NOT EXISTS ${user
          .select("*")
          .where(`email=${v(newEmail)}`)
          .toSelect()}`,
      )
      .queryCount();
    if (count === 0) {
      throw new HttpError(406, { message: "账号不存在" });
    }
  }
}
export const passportService = new PassportService();

async function loginCheck(user: LoginUserInfo | undefined, password: string): Promise<number> {
  if (!user) throw new HttpError(401, { message: "账号或密码错误" });

  const pwdIsEqual = await expectPasswordIsEqual(user, password);
  if (!pwdIsEqual) throw new HttpError(401, { message: "账号或密码错误" });
  if (user.is_deleted || user.is_deleted === null) throw new HttpError(423, { message: "账号已注销" });
  if (user.login_ban) throw new HttpError(423, { message: "账号已被冻结" });
  return user.user_id;
}
async function expectPasswordIsEqual(user: LoginUserInfo, inputPassword: string): Promise<boolean> {
  if (user.pwd_salt && user.password) {
    inputPassword = await hashPasswordBackEnd(inputPassword, user.pwd_salt);
  }
  return typeof inputPassword === "string" && user.password === inputPassword;
}

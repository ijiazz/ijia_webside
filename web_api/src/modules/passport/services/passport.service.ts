import { user, user_profile } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import { signJwt } from "@/global/jwt.ts";
import { ENV } from "@/global/config.ts";
import { hashPasswordBackEnd } from "./password.ts";
import { HttpError } from "@/global/errors.ts";

type LoginUserInfo = {
  user_id: number;
  password?: string;
  pwd_salt?: string;
  login_ban: boolean;
};
export class PassportService {
  private selectUser(where: string) {
    return user
      .select<LoginUserInfo>({
        user_id: "id",
        password: true,
        pwd_salt: true,
        login_ban: "get_bit(status, 0) ",
      })
      .where(["NOT is_deleted", where]);
  }
  private async expectPasswordIsEqual(user: LoginUserInfo | undefined, inputPassword: string): Promise<number> {
    if (!user) throw new HttpError(401, { message: "账号或密码错误" });

    if (user.pwd_salt && user.password) {
      inputPassword = await hashPasswordBackEnd(inputPassword, user.pwd_salt);
    }
    if (typeof inputPassword !== "string" || user.password !== inputPassword)
      throw new HttpError(401, { message: "账号或密码错误" });
    if (user.login_ban) throw new HttpError(423, { message: "账号已被冻结" });
    return user.user_id;
  }
  async loginById(id: number, password: string): Promise<number> {
    const user: LoginUserInfo | undefined = await this.selectUser(`id=${v(id)}`)
      .limit(1)
      .queryRows()
      .then((users) => users[0]);
    return this.expectPasswordIsEqual(user, password);
  }
  async loginByEmail(email: string, password: string): Promise<number> {
    const user = await this.selectUser(`email=${v(email)}`)
      .limit(1)
      .queryRows()
      .then((users) => users[0]);
    return this.expectPasswordIsEqual(user, password);
  }
  signJwt(userId: number, minute: number): Promise<string> {
    const liveMs = minute * 60 * 1000;
    const exp = Date.now() + liveMs;
    return signJwt(userId.toString(), ENV.JWT_KEY, exp);
  }
  async createUser(email: string, userInfo: { password?: string }) {
    let password: string | undefined;
    let salt: string | undefined;
    if (typeof userInfo.password === "string") {
      salt = crypto.randomUUID().replaceAll("-", ""); //16byte
      password = await hashPasswordBackEnd(userInfo.password, salt);
    }
    await using conn = await dbPool.begin();
    const userId = await conn
      .queryRows(
        user.insert({ email, password: password, pwd_salt: salt }).returning<{ user_id: number }>({ user_id: "id" }),
      )
      .then((rows) => rows[0].user_id);
    await conn.queryCount(user_profile.insert({ user_id: userId }));
    await conn.commit();
    return userId;
  }
  async changePassword(uid: number, oldPwd: string, newPwd: string) {
    const salt = crypto.randomUUID().replaceAll("-", ""); //16byte
    const password = await hashPasswordBackEnd(newPwd, salt);

    await using conn = dbPool.begin("REPEATABLE READ");
    const userInfo: LoginUserInfo | undefined = await conn
      .queryRows(this.selectUser(`id=${v(uid)}`).limit(1))
      .then((res) => res[0]);
    if (!userInfo) throw new HttpError(409, { message: "用户不存在" });
    await this.expectPasswordIsEqual(userInfo, oldPwd);
    await conn.queryCount(user.update({ password: v(password), pwd_salt: v(salt) }).where(`id=${v(uid)}`));
    await conn.commit();
  }
}
export const passportService = new PassportService();

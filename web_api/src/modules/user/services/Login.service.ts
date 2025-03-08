import { dclass, user, user_class_bind } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";
import { signJwt } from "@/global/jwt.ts";
import { ENV } from "@/global/config.ts";
import { digestSha512ToHex } from "./password.ts";
import { HttpError } from "@/global/errors.ts";

type LoginUserInfo = {
  user_id: number;
  password?: string;
  pwd_salt?: string;
  login_ban: boolean;
};
export class LoginService {
  private selectUser(where: string) {
    return user
      .select<LoginUserInfo>({
        user_id: "id",
        password: true,
        pwd_salt: true,
        login_ban: "get_bit(status, 0) ",
      })
      .where(["is_deleted !=FALSE OR is_deleted is NULL", where]);
  }
  private async userPasswordIsEqual(user: LoginUserInfo | undefined, inputPassword: string) {
    if (!user) return "用户不存在或密码错误";
    if (user.login_ban) return "账号已被禁止登录";
    if (user.password === undefined) return "账号无法通过密码登录";
    if (user.pwd_salt) {
      inputPassword = await digestSha512ToHex(inputPassword + user.pwd_salt);
    }
    if (user.password !== inputPassword) return "用户不存在或密码错误";
  }
  async loginById(id: number, password: string): Promise<{ userId?: number; message?: string }> {
    const user: LoginUserInfo | undefined = await this.selectUser(`id=${v(id)}`)
      .limit(1)
      .queryRows()
      .then((users) => users[0]);
    const passwordEqual = await this.userPasswordIsEqual(user, password);
    const isOk = !passwordEqual;
    return { message: passwordEqual, userId: isOk ? user!.user_id : undefined };
  }
  async loginByEmail(email: string, password: string): Promise<{ userId?: number; message?: string }> {
    const user = await this.selectUser(`email=${v(email)}`)
      .limit(1)
      .queryRows()
      .then((users) => users[0]);
    const passwordEqual = await this.userPasswordIsEqual(user, password);
    const isOk = !passwordEqual;
    return { message: passwordEqual, userId: isOk ? user!.user_id : undefined };
  }
  signJwt(userId: number, minute: number): Promise<string> {
    const liveMs = minute * 60 * 1000;
    const exp = Date.now() + liveMs;
    return signJwt(userId.toString(), ENV.JWT_KEY, exp);
  }
  async createUser(email: string, userInfo: { password?: string; classId?: number[] }) {
    let password: string | undefined;
    let salt: string | undefined;
    if (typeof userInfo.password === "string") {
      salt = crypto.randomUUID().replaceAll("-", ""); //16byte
      password = await digestSha512ToHex(userInfo.password + salt);
    }
    await using db = dbPool.begin();
    const createUserSql = user
      .insert({ email, password: password, pwd_salt: salt })
      .returning<{ user_id: number }>({ user_id: "id" });

    const userId = await db.queryRows(createUserSql).then((item) => item[0].user_id);
    if (userInfo.classId?.length) {
      // 目前只能选择一个班级
      const classId = userInfo.classId[0];
      const exists = await dclass.select({ id: true }).where(`id=${classId} AND is_public= TRUE`).queryCount();
      if (!exists) throw new HttpError(406, { message: "班级不存在" });
      const insertRoles = user_class_bind.insert(
        userInfo.classId.map((classId) => ({ class_id: classId, user_id: userId })),
      );
      await db.queryCount(insertRoles);
    }
    await db.commit();
    return userId;
  }
}
export const loginService = new LoginService();

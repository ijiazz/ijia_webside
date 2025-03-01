import { user } from "@ijia/data/db";
import v from "@ijia/data/yoursql";
import { signJwt } from "@/crypto/jwt.ts";
import { ENV } from "@/config/mod.ts";
import { hashPasswordBackEnd } from "./password.ts";

type LoginUserInfo = {
  userId: number;
  password?: string;
  pwd_salt?: string;
  login_ban: boolean;
};
export class LoginService {
  private selectUser(where: string) {
    return user
      .select<LoginUserInfo>({
        userId: "id",
        password: true,
        pwd_salt: true,
        login_ban: "get_bit(status, 0) ",
      })
      .where(["is_deleted !=FALSE", where]);
  }
  private async userPasswordIsEqual(user: LoginUserInfo | undefined, inputPassword: string) {
    if (!user) return "用户不存在或密码错误";
    if (user.login_ban) return "账号已被禁止登录";
    if (user.password === undefined) return "账号无法通过密码登录";
    if (user.pwd_salt) {
      inputPassword = await hashPasswordBackEnd(inputPassword, user.pwd_salt);
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
    return { message: passwordEqual, userId: isOk ? user!.userId : undefined };
  }
  async loginByEmail(email: string, password: string): Promise<{ userId?: number; message?: string }> {
    const user = await this.selectUser(`email=${v(email)}`)
      .limit(1)
      .queryRows()
      .then((users) => users[0]);
    const passwordEqual = await this.userPasswordIsEqual(user, password);
    const isOk = !passwordEqual;
    return { message: passwordEqual, userId: isOk ? user!.userId : undefined };
  }
  signJwt(userId: number, minute: number): Promise<string> {
    const liveMs = minute * 60 * 1000;
    const exp = Date.now() + liveMs;
    return signJwt(userId.toString(), ENV.JWT_KEY, exp);
  }
}
export const loginService = new LoginService();

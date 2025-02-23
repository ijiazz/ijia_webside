import { user } from "@ijia/data/db";
import v from "@ijia/data/yoursql";
import { signJwt } from "@/crypto/jwt.ts";
import { ENV } from "@/config/mod.ts";

export class LoginService {
  loginById(id: string, password: string): Promise<{ userId: number }> {
    return user
      .select<{ userId: number }>({ userId: "id" })
      .where(`id=${v(id)} AND password=${v(password)}`)
      .limit(1)
      .queryRows()
      .then((users) => users[0]);
  }
  loginByEmail(email: string, password: string): Promise<{ userId: number }> {
    return user
      .select<{ userId: number }>({ userId: "id" })
      .where(`email=${v(email)} AND password=${v(password)}`)
      .limit(1)
      .queryRows()
      .then((users) => users[0]);
  }
  signJwt(userId: number, minute: number): Promise<string> {
    const liveMs = minute * 60 * 1000;
    const exp = Date.now() + liveMs;
    return signJwt(userId.toString(), ENV.JWT_KEY, exp);
  }
}
export const loginService = new LoginService();

import { dbPool } from "@/db/client.ts";
import { HttpError } from "@/global/errors.ts";
import { hashPasswordBackEnd } from "../-services/password.ts";
import { select, update } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";

export async function changeAccountPassword(uid: number, oldPwd: string, newPwd: string) {
  const salt = crypto.randomUUID().replaceAll("-", ""); //16byte
  const password = await hashPasswordBackEnd(newPwd, salt);

  await using conn = dbPool.begin("REPEATABLE READ");

  const userInfoQuery = select<LoginUserInfo>({
    password: true,
    pwd_salt: true,
  })
    .from("public.user")
    .where([`id=${v(uid)}`, "NOT is_deleted"])
    .limit(1);
  const userInfo: LoginUserInfo | undefined = await conn.queryRows(userInfoQuery).then((rows) => rows[0]);
  if (!userInfo) throw new HttpError(409, { message: "用户不存在" });

  await expectPasswordIsEqual(userInfo, oldPwd);
  await conn.queryCount(
    update("public.user")
      .set({ password: v(password), pwd_salt: v(salt) })
      .where(`id=${v(uid)}`),
  );
  await conn.commit();
}
export async function resetAccountPassword(email: string, newPwd: string) {
  const salt = crypto.randomUUID().replaceAll("-", ""); //16byte
  const password = await hashPasswordBackEnd(newPwd, salt);

  const count = await dbPool.queryCount(
    update("public.user")
      .set({ password: v(password), pwd_salt: v(salt) })
      .where([`email=${v(email)}`, "NOT is_deleted"]),
  );
  if (count === 0) {
    throw new HttpError(409, { message: "账号不存在" });
  }
}
export async function changeAccountEmail(userId: number, newEmail: string) {
  const count = await dbPool.queryCount(
    update("public.user")
      .set({ email: v(newEmail) })
      .where([
        `id=${v(userId)}`,
        `NOT EXISTS ${select("*")
          .from("public.user")
          .where(`email=${v(newEmail)}`)
          .toSelect()}`,
        "NOT is_deleted",
      ]),
  );
  if (count === 0) {
    throw new HttpError(409, { message: "账号不存在" });
  }
}
async function expectPasswordIsEqual(user: LoginUserInfo, inputPassword: string): Promise<void> {
  if (user.pwd_salt && user.password) {
    inputPassword = await hashPasswordBackEnd(inputPassword, user.pwd_salt);
  }

  const errMessage = "账号或密码错误";
  if (typeof inputPassword === "string") {
    if (user.password !== inputPassword) throw new HttpError(401, { message: errMessage });
  } else {
    if (inputPassword) throw new HttpError(401, { message: errMessage });
  }
}
type LoginUserInfo = {
  password?: string;
  pwd_salt?: string;
};

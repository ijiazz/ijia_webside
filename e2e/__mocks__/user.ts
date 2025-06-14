import { DbUserCreate, user } from "@ijia/data/db";
import { v, dbPool } from "@ijia/data/yoursql";
import { api } from "@/__mocks__/fetch.ts";
import { LoginType } from "@/api.ts";
export const E2E_PASSWORD = {
  saved:
    "7bb09a5da06c0db9593efcc439f9c289ac446c084d57b6035e2b8b4d3b1b5d3034091ca9a58ab83d695974a67301df687e7db252d17e57c0089c589155f1676e",
  salt: "3a150d2378a64a49b7ca8d7e80bb51ab",
  raw: "123",
};
export type AccountInfo = {
  id: number;
  email: string;
  password: string;
};
export async function createOverwriteUser(
  uid: number,
  email: string,
  option: { name?: string } = {},
): Promise<AccountInfo> {
  const userData: DbUserCreate = {
    //@ts-ignore
    id: uid,
    email: email,
    //123
    password: E2E_PASSWORD.saved,
    pwd_salt: E2E_PASSWORD.salt,
    nickname: option.name,
  };
  await using q = dbPool.begin();

  const s1 = user
    .insert([userData])
    .onConflict(["id"])
    .doUpdate({
      password: v(userData.password),
      email: v(userData.email),
      pwd_salt: v(userData.pwd_salt),
    });
  await q.queryCount(user.delete({ where: "email=" + v(userData.email) }));
  await q.queryCount(s1);
  await q.commit();

  return {
    id: 100,
    email: userData.email,
    password: E2E_PASSWORD.raw,
  };
}

export function initAlice() {
  return createOverwriteUser(100, "alice@ijiazz.cn", { name: "Alice" });
}
export function initBob() {
  return createOverwriteUser(101, "bob@ijiazz.cn", { name: "Bob" });
}

export async function loginGetToken(email: string, pwd: string) {
  const { sessionId } = await api["/captcha/image"].post();
  const { token } = await api["/passport/login"].post({
    body: {
      method: LoginType.email,
      email,
      password: pwd,
      passwordNoHash: true,
      captcha: { selectedIndex: [0, 1, 2], sessionId },
    },
  });
  return token;
}

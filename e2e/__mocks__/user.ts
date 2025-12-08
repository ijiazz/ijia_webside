import { user } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";
import { createUser } from "@ijia/data/query";
import { api } from "@/__mocks__/fetch.ts";
import { LoginType } from "@/api.ts";
import { v } from "@/sql/utils.ts";
export const E2E_PASSWORD = {
  saved:
    "7bb09a5da06c0db9593efcc439f9c289ac446c084d57b6035e2b8b4d3b1b5d3034091ca9a58ab83d695974a67301df687e7db252d17e57c0089c589155f1676e",
  salt: "3a150d2378a64a49b7ca8d7e80bb51ab",
  raw: "123",
};

async function getNextUserId() {
  const sql = v.gen`SELECT nextval(pg_get_serial_sequence(${user.name}, 'id'))::INT AS id`;
  const { id: id } = await dbPool.queryFirstRow<{ id: number }>(sql);
  return id;
}

export type AccountInfo = {
  id: number;
  email: string;
  password: string;
};
async function createNewUser(name: string): Promise<AccountInfo> {
  const id = await getNextUserId();
  const email = `${name}-${id}@ijiazz.cn`.toLocaleLowerCase();
  const res = await createUser(email, {
    id,
    nickname: name,
    password: E2E_PASSWORD.saved,
    salt: E2E_PASSWORD.salt,
  });

  return {
    id: res.user_id,
    email: email,
    password: E2E_PASSWORD.raw,
  };
}

export function initAlice() {
  return createNewUser("Alice");
}
export function initBob() {
  return createNewUser("Bob");
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

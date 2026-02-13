import { dbPool } from "@/db/client.ts";
import { createUser } from "@ijia/data/query";
import { api } from "@/utils/fetch.ts";
import { LoginMethod, UserIdentifierType } from "@/api.ts";
import { insertIntoValues, v } from "@/sql/utils.ts";
import { DbPlaUserCreate, Platform } from "@ijia/data/db";
import { getAppURLFromRoute } from "@/fixtures/test.ts";
import { BrowserContext } from "@playwright/test";
import { setContextLogin } from "./browser.ts";
import { getSeqIntId } from "./seq.ts";
export const E2E_PASSWORD = {
  saved:
    "7bb09a5da06c0db9593efcc439f9c289ac446c084d57b6035e2b8b4d3b1b5d3034091ca9a58ab83d695974a67301df687e7db252d17e57c0089c589155f1676e",
  salt: "3a150d2378a64a49b7ca8d7e80bb51ab",
  raw: "123",
};

async function getNextUserId() {
  const sql = v.gen`SELECT nextval(pg_get_serial_sequence('public.user', 'id'))::INT AS id`;
  const { id: id } = await dbPool.queryFirstRow<{ id: number }>(sql);
  return id;
}

export type AccountInfo = {
  id: number;
  name: string;
  email: string;
  password: string;
};
async function createNewUser(name?: string): Promise<AccountInfo> {
  const id = await getNextUserId();
  if (!name) name = `e2e-${id}`;

  const email = `e2e-${id}@ijiazz.cn`.toLocaleLowerCase();
  const res = await createUser(email, {
    id,
    nickname: name,
    password: E2E_PASSWORD.saved,
    salt: E2E_PASSWORD.salt,
  });

  return {
    id: res.user_id,
    name: name,
    email: email,
    password: E2E_PASSWORD.raw,
  };
}

export async function createDouyinUser(item: Pick<DbPlaUserCreate, "user_name" | "signature">) {
  const uniqueId = await getSeqIntId();
  const uid = "e2e-" + uniqueId;
  const sec_uid = "e2e-sec-" + uniqueId;

  await dbPool.execute(
    insertIntoValues("pla_user", {
      ...item,
      pla_uid: uid,
      extra: { sec_uid },
      platform: Platform.douYin,
    } satisfies DbPlaUserCreate),
  );
  return {
    pla_uid: uid,
    sec_uid,
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
      method: LoginMethod.password,
      user: { email: email, type: UserIdentifierType.email },
      password: pwd,
      passwordNoHash: true,
      captcha: { selectedIndex: [0, 1, 2], sessionId },
    },
  });
  return token;
}

export const ProfileCenterURL = getAppURLFromRoute("/profile/center");

export async function initContextLogged(context: BrowserContext) {
  const user = await createNewUser("Alice");

  const token = await loginGetToken(user.email, user.password);

  await setContextLogin(context, token);

  return user;
}

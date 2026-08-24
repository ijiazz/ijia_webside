import { dbPool } from "@/db/client.ts";
import { api } from "@/utils/fetch.ts";
import { insertIntoValues } from "@/sql/utils.ts";
import { DbPlaUserCreate, Platform } from "@ijia/school-db/db";
import { newTestUser, getUniqueIdFormDb } from "@ijia/school-db/testlib";
import { getAppURLFromRoute } from "@/utils/app.ts";

export type AccountInfo = {
  id: number;
  name: string;
  email: string;
};

export async function createDouyinUser(item: Pick<DbPlaUserCreate, "user_name" | "signature">) {
  const uniqueId = await getUniqueIdFormDb();
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
export async function initAlice(): Promise<AccountInfo> {
  const res = await newTestUser("Alice");
  return { id: res.id, name: res.nickname, email: res.email };
}
export async function initBob(): Promise<AccountInfo> {
  const res = await newTestUser("Bob");
  return { id: res.id, name: res.nickname, email: res.email };
}

export async function initAdmin(): Promise<AccountInfo & { token: string }> {
  const admin = await newTestUser("Admin", { roles: ["admin"] });
  const token = await loginGetToken(admin.email);
  return { id: admin.id, name: admin.nickname, email: admin.email, token };
}

export async function loginGetToken(email: string) {
  const { token, ...rest } = await api["/test/passport/login"].fetchResult<{ token: string }>({
    body: { email: email },
    method: "POST",
  });
  return token;
}

export const ProfileCenterURL = getAppURLFromRoute("/profile/center");

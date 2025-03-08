import { DbUserCreate, user } from "@ijia/data/db";
import { v, dbPool } from "@ijia/data/yoursql";

export async function initUser() {
  const userData: DbUserCreate = {
    //@ts-ignore
    id: 100,
    email: "e2e_login@ijiazz.cn",
    password:
      "e37d861e94d33c79b2b201280ad3ce78cca10b8b715abd637262db63d6fc41e43f13e03bf72878e12586a8d0937d12b34c2dd6847f8d369bb2e0511081cea0bc",
    pwd_salt: "3a150d2378a64a49b7ca8d7e80bb51ab",
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
    password: "e2e_login@ijiazz.cn",
  };
}

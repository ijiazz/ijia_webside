import { Role } from "@/global/auth.ts";
import { signAccessToken } from "@/global/jwt.ts";
import { createUser } from "@/modules/passport/sql/signup.ts";
import { role, user_role_bind } from "@ijia/data/db";
import v, { dbPool } from "@ijia/data/yoursql";

/** 将角色绑定到用户，如果角色不存在，则创建 */
export async function bindUserRole(userId: number, rolesInput: Set<Role> | Role[]) {
  const roles = rolesInput instanceof Set ? rolesInput : new Set(rolesInput);
  const values = Array.from(roles).map((r) => ({ id: r }));
  const sql = `WITH role_id(id) AS (
      VALUES ${v.objectListToValuesList(values, { id: { sqlType: "TEXT", assertJsType: "string" } }).toString()}
    ), roles AS (
      ${role.insert("id", "SELECT * FROM role_id").onConflict("id").doNotThing().toString()}
    )
    INSERT INTO ${user_role_bind.name} (user_id, role_id)
    SELECT ${v(userId)}, id AS role_id FROM role_id
    `;
  await dbPool.queryCount(sql);
}
export async function prepareUser(nickname: string, option: PrepareUserOption = {}): Promise<UserToken> {
  const email = nickname + "@ijiazz.cn";
  const userId = await createUser(email, { nickname: nickname, password: option.password });
  const { token } = await signAccessToken(userId, { survivalSeconds: 60 * 100 * 60 });

  if (option.roles) {
    await bindUserRole(userId, option.roles);
  }

  return {
    email,
    id: userId,
    token,
    nickname: nickname,
    password: option.password,
  };
}

let uniqueId = 1;

/** 获取唯一名称 */
export function getUniqueName(base: string) {
  return base + uniqueId++;
}
/** 获取全局唯一邮箱，用于公共数据库时创建用户测试 */
export const getUniqueEmail = (base: string) => `${getUniqueName(base)}@ijiazz.cn`;

export async function prepareUniqueUser(nickname: string, option: PrepareUserOption = {}): Promise<UserToken> {
  const email = getUniqueEmail(nickname);
  const id = await createUser(email, { nickname: nickname, password: option.password });
  const { token } = await signAccessToken(id, { survivalSeconds: 60 * 100 * 60 });
  if (option.roles) {
    await bindUserRole(id, option.roles);
  }

  return {
    email,
    id,
    token,
    nickname: nickname,
    password: option.password,
  };
}
export type UserToken = {
  id: number;
  nickname: string;
  token: string;
  email: string;
  password?: string;
};

export type PrepareUserOption = {
  password?: string;
  roles?: Set<Role> | Role[]; // 角色
};

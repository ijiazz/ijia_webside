import { Role } from "@/middleware/auth.ts";
import { signAccessToken } from "@/global/jwt.ts";
import { createUser } from "@/routers/passport/-sql/signup.ts";
import { v } from "@/sql/utils.ts";
import { dbPool } from "@/db/client.ts";
import { newTestUser, getUniqueIdFormDb } from "@ijia/data/testlib";

/** 将角色绑定到用户，如果角色不存在，则创建 */
export async function bindUserRole(userId: number, rolesInput: Set<Role> | Role[]) {
  const roles = rolesInput instanceof Set ? rolesInput : new Set(rolesInput);
  const values = Array.from(roles).map((r) => ({ id: r }));
  const base2 = v.gen`WITH role_id(id) AS (
      VALUES ${new String(v.createExplicitValues(values, { id: { sqlType: "TEXT", assertJsType: "string" } }).text)}
    ), roles AS (
      INSERT INTO role (id) 
      SELECT role_id.id FROM role_id 
      ON CONFLICT (id) DO NOTHING
    )
    INSERT INTO user_role_bind(user_id, role_id)
    SELECT ${userId}, id AS role_id FROM role_id  
    `;

  await dbPool.queryCount(base2);
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

/** 获取唯一名称 */
export async function getUniqueName(base: string) {
  const id = await getUniqueIdFormDb();
  return base + id;
}
/** 获取全局唯一邮箱，用于公共数据库时创建用户测试 */
export const getUniqueEmail = async (base: string) => {
  const id = await getUniqueName(base);
  return `${id}@ijiazz.cn`;
};

export async function prepareUniqueUser(nickname: string, option: PrepareUserOption = {}): Promise<UserToken> {
  const info = await newTestUser(nickname, option);
  const { token } = await signAccessToken(info.id, { survivalSeconds: 60 * 100 * 60 });
  return {
    ...info,
    token,
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

import { verifyLoginJwt, SignInfo } from "@/global/jwt.ts";
import { user, user_role_bind } from "@ijia/data/db";
import { v } from "@ijia/data/yoursql";
import { RequiredLoginError } from "../errors.ts";

async function includeRoles(userId: number, roles: string[]): Promise<boolean> {
  if (!roles.length) return false;
  const select = user_role_bind.select({ role_id: true });

  let count: number;
  if (roles.length === 1) {
    count = await select
      .where(`id=${v(userId)} AND role_id=${v(roles[0])}`)
      .limit(1)
      .queryCount();
  } else {
    count = await select
      .where(`id=${v(userId)} AND role_id IN (${roles.map((item) => v(item))})`)
      .limit(1)
      .queryCount();
  }
  return count > 0;
}
async function getUserRoleNameList(userId: number): Promise<{ user_id: number; role_id_list: string[] }> {
  const [userInfo] = await user
    .fromAs("u")
    .select({
      user_id: "u.id",
      role_id_list: user_role_bind
        .fromAs("bind")
        .select<{ role_id: "string" }>({ role_id: "array_agg(bind.role_id)" })
        .where(`bind.user_id=${v(userId)}`)
        .toSelect(),
    })
    .where("NOT u.is_deleted")
    .queryRows();
  return { role_id_list: userInfo.role_id_list || [], user_id: userInfo.user_id };
}
export class UserInfo {
  constructor(private jwtToken?: string) {}

  #roleNameList?: Promise<UserWithRole>;
  /** 获取有效用户的角色列表 */
  async getRoles(): Promise<UserWithRole> {
    if (!this.#roleNameList) {
      this.#roleNameList = this.getJwtInfo().then(({ userId }) => getUserRoleNameList(+userId));
    }
    return this.#roleNameList;
  }
  #jwtInfo?: Promise<SignInfo>;
  /**
   * 可能要考虑用后被注销或禁用
   */
  async getJwtInfo(): Promise<SignInfo> {
    if (!this.jwtToken) throw new RequiredLoginError();
    if (!this.#jwtInfo) {
      this.#jwtInfo = verifyLoginJwt(this.jwtToken).catch((e) => {
        throw new RequiredLoginError("身份认证已过期");
      });
    }
    return this.#jwtInfo;
  }
  /** 从数据库获取有效用户信息 */
  async getUserInfo(): Promise<{ user_id: number }> {
    const baseInfo = await this.getJwtInfo();
    const [info] = await user
      .select<{ user_id: number }>({ user_id: "id" })
      .where(`id=${v(+baseInfo.userId)} AND NOT is_deleted`)
      .queryRows();
    if (!user) throw new RequiredLoginError("用户不存在");

    return { user_id: info.user_id };
  }
}
export type UserWithRole = {
  user_id: number;
  role_id_list: string[];
};

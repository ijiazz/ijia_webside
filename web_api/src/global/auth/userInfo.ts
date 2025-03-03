import { jwtManage, SignInfo } from "@/global/jwt.ts";
import { user_role_bind } from "@ijia/data/db";
import { v } from "@ijia/data/yoursql";

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
async function getUserRoleNameList(userId: number): Promise<string[]> {
  const roles = await user_role_bind
    .fromAs("bind")
    .select<{ role_name: string }>({ role_name: "role.user_name" })
    .where(`bind.user_id=${v(userId)}`)
    .queryRows();

  return roles.map((item) => item.role_name);
}
export class UserInfo {
  constructor(private jwtToken: string) {}

  #roleNameList?: Promise<string[]>;
  async getRoles(): Promise<string[]> {
    if (!this.#roleNameList) {
      this.#roleNameList = this.getJwtInfo().then(({ userId }) => getUserRoleNameList(+userId));
    }
    return this.#roleNameList;
  }
  #jwtInfo?: Promise<SignInfo>;
  async getJwtInfo(): Promise<SignInfo> {
    if (!this.#jwtInfo) this.#jwtInfo = jwtManage.verify(this.jwtToken);
    return this.#jwtInfo;
  }
}

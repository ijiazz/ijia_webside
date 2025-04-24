import { verifyLoginJwt, SignInfo } from "@/global/jwt.ts";
import { user, user_role_bind } from "@ijia/data/db";
import { v } from "@ijia/data/yoursql";
import { HttpError, RequiredLoginError } from "../errors.ts";
import { getValidUserSampleInfoByUserId, SampleUserInfo } from "@/sql/user.ts";

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
async function getUserRoleNameList(userId: number): Promise<UserWithRole> {
  const [userInfo] = await user
    .fromAs("u")
    .select<UserWithRole>({
      user_id: "u.id",
      email: "u.email",
      nickname: "u.nickname",
      role_id_list: user_role_bind
        .fromAs("bind")
        .select<{ role_id: "string" }>({ role_id: "array_agg(bind.role_id)" })
        .where(`bind.user_id=${v(userId)}`)
        .toSelect(),
    })
    .where("NOT u.is_deleted")
    .queryRows();
  if (!userInfo) throw new HttpError(400, "账号不存在");
  if (!userInfo.role_id_list) userInfo.role_id_list = [];
  return userInfo;
}
export class UserInfo {
  constructor(private jwtToken?: string) {}

  #roleNameList?: Promise<UserWithRole>;
  /** 获取有效用户的角色列表 */
  async getRolesFromDb(): Promise<UserWithRole> {
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
  async getUserId(): Promise<number> {
    const { userId } = await this.getJwtInfo();
    return +userId;
  }

  #userInfo?: Promise<SampleUserInfo>;
  async getValidUserSampleInfo(): Promise<SampleUserInfo> {
    if (!this.#userInfo) {
      this.#userInfo = this.getJwtInfo().then(({ userId }) => getValidUserSampleInfoByUserId(+userId));
    }
    return this.#userInfo;
  }
}
export type UserWithRole = SampleUserInfo & {
  user_id: number;
  role_id_list: string[];
};

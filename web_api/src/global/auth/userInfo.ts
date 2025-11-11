import { verifyAccessToken, AccessTokenData, refreshAccessToken, SignInfo, SignResult } from "@/global/jwt.ts";
import { user, user_role_bind } from "@ijia/data/db";
import { HttpError, RequiredLoginError } from "../errors.ts";
import { getValidUserSampleInfoByUserId, SampleUserInfo } from "@/sql/user.ts";
import { setTimeoutUnRef } from "../utils.ts";
import { v } from "@/sql/utils.ts";
import { select, SqlStatement } from "@asla/yoursql";
import { dbPool } from "@ijia/data/dbclient";

async function includeRoles(userId: number, roles: string[]): Promise<boolean> {
  if (!roles.length) return false;
  const statement1 = select({ role_id: true }).from(user_role_bind.name);

  let statement2: SqlStatement;
  if (roles.length === 1) {
    statement2 = statement1.where(`id=${v(userId)} AND role_id=${v(roles[0])}`).limit(1);
  } else {
    statement2 = statement1.where(`id=${v(userId)} AND role_id IN (${roles.map((item) => v(item))})`).limit(1);
  }
  const res = await dbPool.queryCount(statement2);
  return res > 0;
}
async function getUserRoleNameList(userId: number): Promise<UserWithRole> {
  const [userInfo] = await select<UserWithRole>({
    user_id: "u.id",
    email: "u.email",
    nickname: "u.nickname",
    role_id_list: select<{ role_id: "string" }>({ role_id: "array_agg(bind.role_id)" })
      .from(user_role_bind.name, { as: "bind" })
      .where(`bind.user_id=${v(userId)}`)
      .toSelect(),
  })
    .from(user.name, { as: "u" })
    .where("NOT u.is_deleted")
    .dataClient(dbPool)
    .queryRows();
  if (!userInfo) throw new HttpError(400, "账号不存在");
  if (!userInfo.role_id_list) userInfo.role_id_list = [];
  return userInfo;
}
export class UserInfo {
  private static verifyCache = new Map<string, VerifyAccessTokenCache>();
  constructor(private readonly accessToken?: string) {}
  #roleNameList?: Promise<UserWithRole>;
  /** 获取有效用户的角色列表 */
  async getRolesFromDb(): Promise<UserWithRole> {
    if (!this.#roleNameList) {
      this.#roleNameList = this.getJwtInfo().then(({ userId }) => getUserRoleNameList(+userId));
    }
    return this.#roleNameList;
  }
  async getAccessTokenUpdate(): Promise<{ token: string; maxAge?: number } | undefined> {
    if (this.#needDelete) {
      return { token: "", maxAge: 0 }; // 删除令牌
    }
    if (!this.#needRefresh) return undefined;
    return this.#needRefresh();
  }
  #jwtInfo?: Promise<SignInfo>;
  #needRefresh?: () => Promise<SignResult>;
  #needDelete = false;

  async getJwtInfo(): Promise<AccessTokenData> {
    const accessToken = this.accessToken;
    if (!accessToken) throw new RequiredLoginError();
    if (!this.#jwtInfo) {
      let cache = UserInfo.verifyCache.get(accessToken);
      if (!cache) {
        const promise = this.verifyAccessTokenSetCache(accessToken).then(
          (res) => {
            cache!.resetTimer();
            return res;
          },
          (e) => {
            UserInfo.verifyCache.delete(accessToken);
            throw e;
          },
        );
        cache = new VerifyAccessTokenCache(promise, () => {
          UserInfo.verifyCache.delete(accessToken);
        });
        UserInfo.verifyCache.set(accessToken, cache);
      } else {
        cache.resetTimer(); // 重置缓存过期时间
      }
      this.#jwtInfo = cache.promise;
    }
    return this.#jwtInfo;
  }
  private verifyAccessTokenSetCache(accessToken: string): Promise<SignInfo> {
    return verifyAccessToken(accessToken).then(
      async ({ info, result }) => {
        if (result.isExpired) {
          this.#needDelete = true;
          throw new RequiredLoginError("身份认证已过期");
        }
        if (result.needRefresh) {
          await getValidUserSampleInfoByUserId(+info.userId); //从数据库检测用户信息是否失效

          let refreshToken: Promise<SignResult> | undefined;
          this.#needRefresh = () => {
            if (!refreshToken) refreshToken = refreshAccessToken(info);
            else console.log("cache refreshToken", accessToken);
            return refreshToken;
          };
        }
        return info;
      },
      (e) => {
        throw new RequiredLoginError("未登录");
      },
    );
  }
  async getUserId(): Promise<number> {
    const { userId } = await this.getJwtInfo();
    return +userId;
  }

  #userInfo?: Promise<SampleUserInfo>;
  async getValidUserSampleInfo(): Promise<SampleUserInfo> {
    if (!this.#userInfo) {
      this.#userInfo = this.getUserId().then((userId) => getValidUserSampleInfoByUserId(userId));
    }
    return this.#userInfo;
  }
}

class VerifyAccessTokenCache {
  constructor(
    readonly promise: Promise<SignInfo>,
    private onClear: () => void,
  ) {}
  #startTime = Date.now();
  #clear?: () => void;
  resetTimer() {
    if (Date.now() - this.#startTime > 1000 * 60 * 30) return; // 超过 30 分钟，不重置定时器
    if (this.#clear) this.#clear();
    this.#setTimer();
  }
  #setTimer() {
    this.#clear = setTimeoutUnRef(this.onClear, 20 * 1000); // 20秒后清除缓存
  }
}
type CookieItem = {
  value: string;
  maxAge?: number;
};
export type UserWithRole = SampleUserInfo & {
  user_id: number;
  role_id_list: string[];
};

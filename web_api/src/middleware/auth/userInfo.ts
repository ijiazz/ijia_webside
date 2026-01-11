import { verifyAccessToken, AccessUserData, AccessToken } from "@/global/jwt.ts";
import { HttpError, RequiredLoginError } from "@/global/errors.ts";
import { getValidUserSampleInfoByUserId, SampleUserInfo } from "@/sql/user.ts";
import { setTimeoutUnRef } from "@/global/utils.ts";
import { getUserRoleNameList, UserWithRole } from "@ijia/data/query";

export class UserInfo {
  private static verifyCache = new Map<string, VerifyAccessTokenCache<AccessUserData>>();
  constructor(private readonly accessToken?: string) {}
  #roleNameList?: Promise<UserWithRole>;
  /** 获取有效用户的角色列表 */
  async getRolesFromDb(): Promise<UserWithRole> {
    if (!this.#roleNameList) {
      this.#roleNameList = this.getUserId().then(async (userId) => {
        const userInfo = await getUserRoleNameList(+userId);
        if (!userInfo) throw new HttpError(400, "账号不存在");
        if (!userInfo.role_id_list) userInfo.role_id_list = [];
        return userInfo;
      });
    }
    return this.#roleNameList;
  }
  async checkUpdateToken(): Promise<{ token: string; maxAge: number | null } | undefined> {
    if (this.#needDelete) {
      return { token: "", maxAge: 0 }; // 删除令牌
    }
    if (!this.#needRefresh) return undefined;
    return this.#needRefresh();
  }
  #jwtInfo?: Promise<AccessUserData>;
  #needRefresh?: () => Promise<AccessToken<AccessUserData>>;
  #needDelete = false;

  private async getJwtInfo(): Promise<AccessUserData> {
    const accessToken = this.accessToken;
    if (!accessToken) throw new RequiredLoginError();
    if (!this.#jwtInfo) {
      let cache = UserInfo.verifyCache.get(accessToken);
      if (!cache) {
        const promise = this.verifyAccessTokenSetCache(accessToken).then(
          (res): AccessUserData => {
            cache!.resetTimer();
            return res.data;
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
  private verifyAccessTokenSetCache(accessToken: string): Promise<AccessToken<AccessUserData>> {
    return verifyAccessToken(accessToken).then(
      async (accessToken) => {
        if (accessToken.isExpired) {
          this.#needDelete = true;
          throw new RequiredLoginError("身份认证已过期");
        }
        if (accessToken.needRefresh) {
          await getValidUserSampleInfoByUserId(accessToken.data.userId); //从数据库检测用户信息是否失效

          let refreshToken: Promise<AccessToken<AccessUserData>> | undefined;
          this.#needRefresh = () => {
            if (!refreshToken) refreshToken = accessToken.refresh();
            return refreshToken;
          };
        }
        return accessToken;
      },
      (e) => {
        throw new RequiredLoginError("未登录");
      },
    );
  }
  async getUserId(): Promise<number> {
    const { userId } = await this.getJwtInfo();
    return userId;
  }

  #userInfo?: Promise<SampleUserInfo>;
  async getValidUserSampleInfo(): Promise<SampleUserInfo> {
    if (!this.#userInfo) {
      this.#userInfo = this.getUserId().then((userId) => getValidUserSampleInfoByUserId(userId));
    }
    return this.#userInfo;
  }
}

class VerifyAccessTokenCache<T> {
  constructor(
    readonly promise: Promise<T>,
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

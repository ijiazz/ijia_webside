import { ENV } from "@/global/config.ts";
import { Platform } from "@ijia/data/db";
import { HoFetch, HoFetchStatusError } from "@asla/hofetch";
import { HttpError } from "@/global/errors.ts";
import { toErrorStr } from "evlib";
import { HTTPException } from "hono/http-exception";

export async function getUerSecIdFromShareUrl(urlStr: string) {
  const checkUrl = new URL(urlStr);
  let url: URL;
  if (checkUrl.hostname === "v.douyin.com") {
    const res = await fetch(urlStr, { redirect: "manual" });
    if (res.status !== 302) throw new Error(`解析失败，返回 ${res.status} 状态码`);

    try {
      url = new URL(res.headers.get("Location")!);
    } catch (error) {
      throw new Error(`无法解析 Location 响应头 ${res.headers.get("Location")}`);
    }
  } else {
    url = checkUrl;
  }

  const secUid = url.pathname.match(/\/user\/(?<secUid>.+)/)?.groups?.secUid;
  if (!secUid) throw new Error("获取 secUid 失败");
  return secUid;
}
function createCheckServer(token: string, serverUrl: string) {
  const hoFetch = new HoFetch({ defaultOrigin: new URL(serverUrl).origin });
  hoFetch.use(function (ctx, next) {
    ctx.headers.set("cookie", "jwt_token=" + token);
    return next();
  });
  return hoFetch;
}
export class CheckServer {
  private hoFetch: HoFetch;
  constructor(token: string, serverUrl: string) {
    this.hoFetch = createCheckServer(token, serverUrl);
  }
  /**
   * 获取平台用户信息
   * @param uid 抖音是 sec_id
   */
  async syncUserInfo(platform: Platform, uid: string): Promise<PlatformUserBasicInfo> {
    try {
      const res = await this.hoFetch.fetch<PlatformUserBasicInfo>(`/p/${platform}/user/sync`, {
        method: "POST",
        params: { uid: uid },
      });
      return res.bodyData;
    } catch (error) {
      throw getError(error);
    }
  }
  /**
   * 查看平台用户是否按要求添加了属于 id 的认证信息
   * @param uid 抖音是 sec_id
   */
  async checkPlatformUserInfo(uid: string, ijia_id: string | number): Promise<PlatformUserBasicInfoCheckResult> {
    try {
      const { bodyData } = await this.hoFetch.fetch<PlatformUserBasicInfoCheckResult>(
        `/p/${Platform.douYin}/user/check_bind`,
        {
          method: "POST",
          params: { uid: uid, ijia_id: ijia_id },
        },
      );
      return bodyData;
    } catch (error) {
      throw getError(error);
    }
  }

  /** 查看平台用户是否正在直播 */
  async userIsLive(uid: string): Promise<0 | 1> {
    const { bodyData } = await this.hoFetch.fetch<{ live_status: 0 | 1 }>(`/p/${Platform.douYin}/user/is_live`, {
      params: { uid: uid },
    });
    return bodyData.live_status;
  }
}

function getError(error: unknown): HttpError {
  if (error instanceof HoFetchStatusError) {
    const body = error.body instanceof ReadableStream ? error.body : JSON.stringify(error.body);
    return new HTTPException(502, { res: new Response(body, { headers: error.headers }) });
  }
  return new HttpError(502, { message: toErrorStr(error) });
}
let checkServer: CheckServer | undefined;
export function getCheckerServer() {
  if (!checkServer) {
    if (!ENV.CHECK_SERVER) throw new Error("需要 CHECK_SERVER 环境变量");
    const url = new URL(ENV.CHECK_SERVER);
    checkServer = new CheckServer(url.username, url.origin);
  }
  return checkServer;
}
export type PlatformUserBasicInfo = {
  pla_uid: string;
  username?: string | null;
  description?: string | null;
  avatarPath?: string | null;
  platform: Platform;
};
export type PlatformUserBasicInfoCheckResult = PlatformUserBasicInfo & { pass: boolean };

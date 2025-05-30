import { ENV } from "@/config.ts";
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
  hoFetch.use(function (ctx, next) {
    return next().catch((res) => {
      throw getError(res);
    });
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
    const res = await this.hoFetch.fetch<PlatformUserBasicInfo>(`/p/${platform}/user/sync`, {
      method: "POST",
      query: { uid: uid },
    });
    return res.bodyData;
  }
  /**
   * 查看平台用户是否按要求添加了属于 id 的认证信息
   * @param uid 抖音是 sec_id
   */
  async checkPlatformUserInfo(uid: string, ijia_id: string | number): Promise<PlatformUserBasicInfoCheckResult> {
    const { bodyData } = await this.hoFetch.fetch<PlatformUserBasicInfoCheckResult>(
      `/p/${Platform.douYin}/user/check_bind`,
      {
        method: "POST",
        query: { uid: uid, ijia_id: ijia_id },
      },
    );
    return bodyData;
  }

  /** 查看平台用户是否正在直播 */
  async userIsLive(uid: string): Promise<0 | 1> {
    const { bodyData } = await this.hoFetch.fetch<{ live_status: 0 | 1 }>(`/p/${Platform.douYin}/user/is_live`, {
      query: { uid: uid },
    });
    return bodyData.live_status;
  }
  /** 获取最新作品信息 */
  async getNewsPost() {
    const { bodyData } = await this.hoFetch.fetch(`/p/post/newest`);
    return bodyData;
  }
}

function getError(error: unknown): HttpError {
  if (error instanceof HoFetchStatusError) {
    const body = error.body instanceof ReadableStream ? error.body : JSON.stringify(error.body);
    return new HTTPException(error.status as any, { res: new Response(body, { headers: error.headers }) });
  }
  return new HTTPException(502, { res: Response.json({ message: "服务暂不可用", reason: toErrorStr(error) }) });
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

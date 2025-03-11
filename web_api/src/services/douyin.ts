import { ENV } from "@/global/config.ts";
import { Platform } from "@ijia/data/db";

export async function getUerSecIdFromShareUrl(urlStr: string) {
  const res = await fetch(urlStr, { redirect: "manual" });
  if (res.status !== 302) throw new Error(`解析失败，返回 ${res.status} 状态码`);

  let url: URL;
  try {
    url = new URL(res.headers.get("Location")!);
  } catch (error) {
    throw new Error(`无法解析 Location 响应头 ${res.headers.get("Location")}`);
  }
  const secUid = url.pathname.match(/\/user\/(?<secUid>.+)/)?.groups?.secUid;
  if (!secUid) throw new Error("获取 secUid 失败");
  return secUid;
}
export class CheckServer {
  private checkerServer: string;
  constructor(
    private token: string,
    serverUrl: string,
  ) {
    this.checkerServer = serverUrl;
  }
  async getDouYinUserInfo(secUid: string): Promise<PlatformUserBasicInfo> {
    const url = new URL(`${this.checkerServer}/user_info/${Platform.douYin}`);
    url.searchParams.set("uid", secUid);
    const res = await fetch(url);
    return res.json() as Promise<any>;
  }
  async checkUserBind(pla_uid: string, id: string) {
    const url = new URL(`${this.checkerServer}/check_user_bind/${Platform.douYin}`);
    url.searchParams.set("pla_uid", pla_uid);
    url.searchParams.set("uer_id", id);
    const res = await fetch(url);
    if (res.status !== 200) throw new Error(`无效的 status`);

    return res.json() as Promise<PlatformUserBasicInfo & { pass: boolean; reason?: string }>;
  }

  async userIsLive(secUid: string): Promise<0 | 1> {
    const url = new URL(`${this.checkerServer}/user_is_live/${Platform.douYin}`);
    url.searchParams.set("uid", secUid);
    const resp = await fetch(url, { headers: { cookie: "jwt_token=" + this.token } });
    let res = (await resp.json()) as { live_status: 0 | 1 };
    return res.live_status;
  }
}
let checkServer: CheckServer | undefined;
export function getCheckerServer() {
  if (!checkServer) {
    if (!ENV.CHECK_SERVER) throw new Error("需要 CHECK_SERVER 环境变量");
    const url = new URL(ENV.CHECK_SERVER);
    checkServer = new CheckServer(url.password, url.origin);
  }
  return checkServer;
}
export function setCheckerServer(server: CheckServer) {
  checkServer = server;
}
export type PlatformUserBasicInfo = {
  pla_uid: string;
  username: string;
  description: string;
  avatarPath: string;
};

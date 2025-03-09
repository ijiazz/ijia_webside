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
  constructor(private token: string) {
    if (!ENV.CHECK_SERVER) throw new Error("需要 CHECK_SERVER 环境变量");
    this.checkerServer = ENV.CHECK_SERVER;
  }
  async getDouYinUserInfo(secUid: string): Promise<UserBasicInfo> {
    const url = new URL(`${this.checkerServer}/user_info/${Platform.douYin}`);
    url.searchParams.set("uid", secUid);
    const res = await fetch(url);
    return res.json() as Promise<any>;
  }
  async fetchResource(path: string) {
    const res = await fetch(`${this.checkerServer + path}`);
    if (res.status !== 200) throw new Error(`无效的 status`);
    return { body: res.body, headers: res.headers, contentType: res.headers.get("content-type") };
  }

  async userIsLive(secUid: string): Promise<0 | 1> {
    const url = new URL(`${this.checkerServer}/user_is_live/${Platform.douYin}`);
    url.searchParams.set("uid", secUid);
    const resp = await fetch(url, { headers: { cookie: "jwt_token=" + this.token } });
    let res = (await resp.json()) as { live_status: 0 | 1 };
    return res.live_status;
  }
}
export type UserBasicInfo = {
  pla_uid: string;
  userName: string;
  description: string;
  avatarPath: string;
};

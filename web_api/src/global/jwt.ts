import * as jwtLib from "hono/jwt";
import { ENV } from "@/config.ts";
export interface SignInfo {
  userId: string;
  exp?: number;
}

export function signJwt(uname: string, key: string, exp?: number): Promise<string> {
  if (!uname || typeof uname !== "string") throw TypeError("uname 必须是一个字符串");
  const body: SignInfo = { userId: uname, exp: exp };
  return jwtLib.sign(body as Record<string, any>, key, "HS256");
}
export async function hashPwd(pwd: string, salt: string = "") {
  const data = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(salt + pwd));
  const u8Arr = new Uint8Array(data, 0, data.byteLength);
  let str = "";
  for (let i = 0; i < u8Arr.length; i++) {
    str += u8Arr[i].toString(16);
  }
  return str;
}
export class Jwt<T extends {}> {
  constructor(private key: string) {}
  sign(data: T) {
    return jwtLib.sign(data, data, "HS256");
  }
  async verify(jwtToken: string): Promise<SignInfo> {
    const content: Partial<SignInfo> = await jwtLib.verify(jwtToken, this.key);
    if (content.exp && content.exp < Date.now()) {
      throw new Error("身份验证已过期");
    }
    if (!content.userId) throw new Error("缺少用户名");
    return content as unknown as SignInfo;
  }
}
let jwtKey: string;
if (ENV.JWT_KEY) jwtKey = ENV.JWT_KEY;
else if (ENV.IS_PROD) jwtKey = crypto.randomUUID().replaceAll("-", "");
else {
  console.warn("缺少环境变量 JWT_KEY, 将使用默认值");
  jwtKey = "abcd108";
}

export const jwtManage = new Jwt(jwtKey);

import * as jwtLib from "hono/jwt";
import { ENV } from "@/config.ts";
export interface SignInfo {
  userId: string;
  exp?: number;
}

export function signLoginJwt(uname: number, minute: number): Promise<string> {
  const liveMs = minute * 60 * 1000;
  const body: SignInfo = { userId: uname.toString(), exp: Date.now() + liveMs };
  return signSysJWT(body);
}
export async function verifyLoginJwt(token: string): Promise<SignInfo> {
  const data: SignInfo = (await parseSysJWT(token)) as any;
  if (data.exp && data.exp < Date.now()) {
    throw new Error("身份验证已过期");
  }
  if (!data.userId) throw new Error("缺少用户名");
  return data;
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

const JWT_KEY = ENV.JWT_KEY;

export function signSysJWT(data: Record<string, any>) {
  return jwtLib.sign(data, JWT_KEY, "HS256");
}
export async function parseSysJWT(jwtToken: string): Promise<Record<string, any>> {
  return jwtLib.verify(jwtToken, JWT_KEY, "HS256");
}

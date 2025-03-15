import { Buffer } from "node:buffer";

const SALT = "我是一坨盐";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
async function digestSha512ToHex(string: string) {
  const hash = Buffer.from(string, "hex");
  const data = await crypto.subtle.digest("SHA-512", hash);
  const hex = Buffer.from(data, 0, data.byteLength).toString("hex");
  return hex;
}
async function hashString(pwd: string) {
  if (typeof pwd !== "string") throw new Error("pwd 必须是一个字符串");

  const data = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(pwd));
  const u8Arr = new Uint8Array(data, 0, data.byteLength);
  return toHex(u8Arr);
}
function toHex(u8Arr: Uint8Array) {
  let str = "";
  for (let i = 0; i < u8Arr.length; i++) {
    str += u8Arr[i].toString(16).padStart(2, "0");
  }
  return str;
}
export async function hashPasswordBackEnd(pwd: string, salt: string) {
  return digestSha512ToHex(pwd + salt);
}
export async function hashPasswordFrontEnd(pwd: string) {
  if (typeof pwd !== "string") throw TypeError("pwd 必须是 string 类型");
  return hashString(SALT + pwd);
}

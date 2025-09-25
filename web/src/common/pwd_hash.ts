const SALT = "我是一坨盐";
function toHex(u8Arr: Uint8Array) {
  let str = "";
  for (let i = 0; i < u8Arr.length; i++) {
    str += u8Arr[i].toString(16).padStart(2, "0");
  }
  return str;
}
export async function hashPassword(pwd: string) {
  if (typeof pwd !== "string") throw new Error("pwd 必须是一个字符串");
  if (!CAN_HASH_PASSWORD) throw new Error("crypto.subtle.digest() 方法不存在。 必须在 https 协议下调用该函数");
  const data = new TextEncoder().encode(SALT + pwd);
  const hash = await crypto.subtle.digest("SHA-512", data);
  const u8Arr = new Uint8Array(hash, 0, hash.byteLength);

  return toHex(u8Arr);
}
export const CAN_HASH_PASSWORD = typeof crypto.subtle?.digest === "function";

export async function tryHashPassword(pwd: string): Promise<{
  password: string;
  passwordNoHash: boolean;
}> {
  if (CAN_HASH_PASSWORD) {
    return {
      password: await hashPassword(pwd),
      passwordNoHash: false,
    };
  } else {
    return {
      password: pwd,
      passwordNoHash: true,
    };
  }
}

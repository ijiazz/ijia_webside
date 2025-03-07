const SALT = "我是一坨盐";

export async function hashPassword(pwd: string) {
  if (typeof pwd !== "string") throw new Error("pwd 必须是一个字符串");
  if (!CAN_HASH_PASSWORD) throw new Error("crypto.subtle.digest() 方法不存在。 必须在 https 协议下调用该函数");

  const data = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(SALT + pwd));
  const u8Arr = new Uint8Array(data, 0, data.byteLength);
  let str = "";
  for (let i = 0; i < u8Arr.length; i++) {
    str += u8Arr[i].toString(16);
  }
  return str;
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

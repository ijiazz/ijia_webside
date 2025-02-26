const SALT = "我是一坨盐";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
async function digestSha512ToHex(string: string) {
  const data = await crypto.subtle.digest("SHA-512", textEncoder.encode(string));
  const u8Arr = new Uint8Array(data, 0, data.byteLength);
  let str = "";
  for (let i = 0; i < u8Arr.length; i++) {
    str += u8Arr[i].toString(16);
  }
  return str;
}

export async function hashPasswordFrontEnd(pwd: string) {
  if (typeof pwd !== "string") throw TypeError("pwd 必须是 string 类型");
  return digestSha512ToHex(SALT + pwd);
}

export async function hashPasswordBackEnd(pwd: string, salt: string) {
  if (typeof pwd !== "string") throw TypeError("pwd 必须是 string 类型");
  if (typeof salt !== "string") throw TypeError("salt 必须是 string 类型");
  return digestSha512ToHex(pwd + salt);
}

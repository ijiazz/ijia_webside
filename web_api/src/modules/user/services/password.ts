const SALT = "我是一坨盐";

export async function hashPassword(pwd: string) {
  const data = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(SALT + pwd));
  const u8Arr = new Uint8Array(data, 0, data.byteLength);
  let str = "";
  for (let i = 0; i < u8Arr.length; i++) {
    str += u8Arr[i].toString(16);
  }
  return str;
}

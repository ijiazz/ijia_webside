import { Platform } from "@ijia/data/db";
import { UserLive } from "./src/modules/user/services/user_live.service.ts";
import fs from "node:fs/promises";
const tmpCookie =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmFtZSI6InRlc3QiLCJleHAiOjE3Mzg0MTkyODg1NTF9.w9sXxgtTb6R5hj3OsxKzBK5PVnCBYVET8_Gzy1nWMog";

const cookie = await fetch("http://127.0.0.1:9000/passport/alloc_token", {
  method: "POST",
  headers: { cookie: "jwt_token=" + tmpCookie },
}).then((res) => {
  if (res.ok && res.headers.get("content-type") === "application/json") {
    return res.json().then((res: any) => res.jwtToken);
  } else throw new Error(res.statusText);
});

const uid = "MS4wLjABAAAA0AiK9Q4FlkTxKHo-b6Vi1ckA2Ybq-WNgJ-b5xXlULtI";
const url = new URL(`http://127.0.0.1:9000/user_is_live/${Platform.douYin}`);
url.searchParams.set("uid", uid);

const fd = await fs.open("watch.txt", "a+");

const userLive = new UserLive(async function () {
  const resp = await fetch(url, { headers: { cookie: "jwt_token=" + cookie } });
  if (!resp.ok) throw new Error("response status " + resp.status);
  console.log(new Date().toLocaleString());
  let res = (await resp.json()) as { live_status: 0 | 1 };
  return res.live_status;
});
userLive.onError = console.error;
userLive.onChange = (isLive) => {
  if (isLive) fd.appendFile(new Date().toLocaleString() + " live\n");
};

userLive.start();

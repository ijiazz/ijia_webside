import fs from "node:fs/promises";
import { captcha_picture } from "@ijia/data/db";

async function insert(dir: string) {
  const list = await fs.readdir(dir);
  const result = await captcha_picture
    .insert(list.map((item) => ({ id: item })))
    .onConflict(["id"])
    .doNotThing()
    .returning("*")
    .queryRows();
}
// await insert("");

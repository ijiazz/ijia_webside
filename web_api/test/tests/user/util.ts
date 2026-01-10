import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import { dbPool } from "@/db/client.ts";

export function getUserPublicClassId(user_id: number): Promise<number[]> {
  return dbPool
    .queryRows(
      select("bind.*")
        .from("user_class_bind", { as: "bind" })
        .innerJoin("public.class", {
          as: "class",
          on: [`bind.user_id=${v(user_id)}`, `class.parent_class_id=${PUBLIC_CLASS_ROOT_ID}`, "class.id=bind.class_id"],
        }),
    )
    .then((res) => res.map((item) => item.class_id));
}
export function getUserClassId(user_id: number): Promise<number[]> {
  return dbPool
    .queryRows(
      select("bind.*")
        .from("user_class_bind", { as: "bind" })
        .innerJoin("public.class", {
          as: "class",
          on: [`bind.user_id=${v(user_id)}`, "class.id=bind.class_id"],
        }),
    )
    .then((res) => res.map((item) => item.class_id));
}

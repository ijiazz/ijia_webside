import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { dclass, PUBLIC_CLASS_ROOT_ID, user_class_bind } from "@ijia/data/db";
import { dbPool } from "@ijia/data/dbclient";

export function getUserPublicClassId(user_id: number): Promise<number[]> {
  return select("bind.*")
    .from(user_class_bind.name, { as: "bind" })
    .innerJoin(dclass.name, {
      as: "class",
      on: [`bind.user_id=${v(user_id)}`, `class.parent_class_id=${PUBLIC_CLASS_ROOT_ID}`, "class.id=bind.class_id"],
    })
    .dataClient(dbPool)
    .queryRows()
    .then((res) => res.map((item) => item.class_id));
}
export function getUserClassId(user_id: number): Promise<number[]> {
  return select("bind.*")
    .from(user_class_bind.name, { as: "bind" })
    .innerJoin(dclass.name, {
      as: "class",
      on: [`bind.user_id=${v(user_id)}`, "class.id=bind.class_id"],
    })
    .dataClient(dbPool)
    .queryRows()
    .then((res) => res.map((item) => item.class_id));
}

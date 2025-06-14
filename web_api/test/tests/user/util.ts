import { dclass, PUBLIC_CLASS_ROOT_ID, user_class_bind } from "@ijia/data/db";
import v from "@ijia/data/yoursql";

export function getUserPublicClassId(user_id: number): Promise<number[]> {
  return user_class_bind
    .fromAs("bind")
    .innerJoin(dclass, "class", [
      `bind.user_id=${v(user_id)}`,
      `class.parent_class_id=${PUBLIC_CLASS_ROOT_ID}`,
      "class.id=bind.class_id",
    ])
    .select("bind.*")
    .queryRows()
    .then((res) => res.map((item) => item.class_id));
}
export function getUserClassId(user_id: number): Promise<number[]> {
  return user_class_bind
    .fromAs("bind")
    .innerJoin(dclass, "class", [`bind.user_id=${v(user_id)}`, "class.id=bind.class_id"])
    .select("bind.*")
    .queryRows()
    .then((res) => res.map((item) => item.class_id));
}

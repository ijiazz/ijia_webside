import { dclass, user_class_bind, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";
import v, { ChainInsert, Selection } from "@ijia/data/yoursql";

export function setUserPublicClass(userId: number, classId: number): ChainInsert<{}> {
  const exists = dclass
    .select({ class_id: "id", user_id: v(userId) })
    .where([`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`, `id=${v(classId)}`]);
  return user_class_bind.insert("class_id, user_id", exists.toString());
}
export function deletePublicClassOfUser(userId: number) {
  return user_class_bind.delete({
    where: [
      `user_id=${v(userId)}`,
      "EXISTS " +
        Selection.from(dclass)
          .select("*")
          .where([`parent_class_id=${PUBLIC_CLASS_ROOT_ID}`, `class.id=user_class_bind.class_id`])
          .toSelect(),
    ],
  });
}

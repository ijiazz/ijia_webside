import { dclass, user_class_bind } from "@ijia/data/db";
import v, { ChainInsert, Selection } from "@ijia/data/yoursql";

export function setPublicClass(userId: number, classId: number): ChainInsert<{}> {
  const exists = dclass.select({ class_id: "id", user_id: v(userId) }).where(`id=${v(classId)} AND is_public`);
  return user_class_bind.insert("class_id, user_id", exists.toString());
}
export function deletePublicClass(userId: number) {
  return user_class_bind.delete({
    where: [
      `user_id=${v(userId)}`,
      "EXISTS " +
        Selection.from(dclass).select("*").where(`class.id=user_class_bind.class_id AND class.is_public`).toSelect(),
    ],
  });
}

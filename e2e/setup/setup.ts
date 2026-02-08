import { dbPool } from "@/db/client.ts";
import { insertIntoValues } from "@/sql/utils.ts";
import { POST_LONG, POST_GROUPS } from "@/utils/post.ts";
import { DbPostGroupCreate, PUBLIC_CLASS_ROOT_ID } from "@ijia/data/db";

export default async function setup() {
  await initPublicClass();
  await initPostGroup();

  console.log("setup complete");
}
async function initPostGroup() {
  const values = [...POST_GROUPS, POST_LONG].map(({ id, name }): DbPostGroupCreate & { id: number } => ({
    name,
    id,
  }));

  const c = insertIntoValues("post_group", values).onConflict("id").doUpdate({ name: "EXCLUDED.name" });
  await dbPool.execute(c);
}
async function initPublicClass() {
  await dbPool.execute(
    insertIntoValues("class", [
      { id: -1, class_name: "e2e-8", parent_class_id: PUBLIC_CLASS_ROOT_ID },
      { id: -2, class_name: "e2e-1", parent_class_id: PUBLIC_CLASS_ROOT_ID },
    ])
      .onConflict("id")
      .doUpdate({ class_name: "EXCLUDED.class_name", parent_class_id: "EXCLUDED.parent_class_id" }),
  );
}

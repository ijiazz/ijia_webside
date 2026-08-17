import { dbPool } from "@/db/client.ts";
import { insertIntoValues } from "@/sql/utils.ts";
import { POST_LONG, POST_GROUPS } from "@/utils/post.ts";
import { DbPostGroupCreate, PUBLIC_CLASS_ROOT_ID } from "@ijia/school-db/db";

export default async function setup() {
  await initPublicClass();
  await initPostGroup();
  await initRoles();

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

export async function initRoles() {
  const sql = insertIntoValues("role", [
    { id: "root", role_name: "超级管理员", description: "超级管理员" },
    { id: "admin", role_name: "管理员", description: "管理员" },
  ])
    .onConflict("id")
    .doNotThing();

  await dbPool.execute(sql);
}

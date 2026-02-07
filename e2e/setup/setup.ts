import { dbPool } from "@/db/client.ts";
import { insertIntoValues } from "@/sql/utils.ts";
import { POST_LONG, POST_GROUPS } from "@/utils/post.ts";
import { DbPostGroupCreate } from "@ijia/data/db";

export default async function setup() {
  const values = [...POST_GROUPS, POST_LONG].map(({ id, name }): DbPostGroupCreate & { id: number } => ({
    name,
    id,
  }));

  const c = insertIntoValues("post_group", values).onConflict("id").doUpdate({ name: "EXCLUDED.name" });
  await dbPool.execute(c);

  console.log("初始化表白墙分组完成");
}

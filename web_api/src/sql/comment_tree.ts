import { dbPool } from "@/db/client.ts";
import { insertIntoValues } from "./utils.ts";
import { CommentGroup } from "@ijia/data/db";
import { ExecutableSQL } from "@asla/yoursql/client";

export function createCommentTree(group: CommentGroup | null): ExecutableSQL<number> {
  return dbPool.createQueryableSQL<{ id: number }, number>(
    insertIntoValues("comment_tree", { group_type: group }).returning("id"),
    (t, q) => t.queryFirstRow(q).then((row) => row?.id),
  );
}

import { pla_comment, pla_user } from "@ijia/data/db";
import { Selection } from "@ijia/data/yoursql";

const page = 0,
  pageSize = 20;
const commentByUser = pla_comment
  .select({ uid: "pla_uid", comment_total: "count(*)" }, "t")
  .where(["root_comment_id IS NULL"])
  .groupBy("pla_uid");

const sql = Selection.from(commentByUser, "t")
  .innerJoin(pla_user, "p", "p.pla_uid=t.uid")
  .select("t.*, p.user_name, p.avatar")
  .orderBy("comment_total DESC")
  .limit(+pageSize, page * +pageSize);
console.log(sql.toString());

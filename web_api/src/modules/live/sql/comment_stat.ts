import { pla_comment, pla_user } from "@ijia/data/db";
import { dbPool } from "@ijia/data/dbclient";
import { GetListOption } from "@/dto/common.ts";
import { CommentStatByCount } from "../comment.api.ts";
import { select } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";

export async function getCommentCount(timeStart: Date, option: GetListOption) {
  const { number = 20, offset = 0 } = option;
  const commentByUser = select({ id: "pla_uid", comment_total: "count(*)::INT" })
    .from(pla_comment.name, { as: "t" })
    .where(["root_comment_id IS NULL", `publish_time >${v(timeStart)}`])
    .groupBy("pla_uid");

  const list = select<CommentStatByCount>("t.*, p.user_name as name, '/file/avatar/'||p.avatar AS avatar_url")
    .from(commentByUser.toSelect(), { as: "t" })
    .innerJoin(pla_user.name, { as: "p", on: "p.pla_uid=t.id" })
    .where(["t.comment_total > 10"])
    .orderBy("comment_total DESC, t.id ASC")
    .limit(number, offset)
    .dataClient(dbPool)
    .queryRows();

  return list;
}

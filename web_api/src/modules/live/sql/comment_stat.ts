import { pla_comment, pla_user } from "@ijia/data/db";
import { Selection, v } from "@ijia/data/dbclient";
import { GetListOption } from "@/modules/dto_common.ts";
import { CommentStatByCount } from "../comment.api.ts";

export async function getCommentCount(timeStart: Date, option: GetListOption) {
  const { number = 20, offset = 0 } = option;
  const commentByUser = pla_comment
    .select({ id: "pla_uid", comment_total: "count(*)::INT" }, "t")
    .where(["root_comment_id IS NULL", `publish_time >${v(timeStart)}`])
    .groupBy("pla_uid");

  const list = Selection.from(commentByUser, "t")
    .innerJoin(pla_user, "p", "p.pla_uid=t.id")
    .select<CommentStatByCount>("t.*, p.user_name as name, '/file/avatar/'||p.avatar AS avatar_url")
    .where(["t.comment_total > 10"])
    .orderBy("comment_total DESC, t.id ASC")
    .limit(number, offset)
    .queryRows();

  return list;
}

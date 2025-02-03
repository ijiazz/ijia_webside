import { Permissions } from "@/global/auth.ts";
import { pla_comment, pla_user } from "@ijia/data/db";
import { DbQuery, Selection } from "@ijia/data/yoursql";
import { Controller, Get, Query } from "@nestjs/common";

@Controller()
export class CommentStat {
  constructor(private query: DbQuery) {}
  @Permissions(["root"])
  @Get("comment/count_by_user")
  async getUserByCount(@Query() option: { page?: number; pageSize?: number } = {}) {
    const { page = 0, pageSize = 20 } = option;
    const commentByUser = pla_comment
      .select({ uid: "pla_uid", comment_total: "count(*)::INT" }, "t")
      .where(["root_comment_id IS NULL", "publish_time >'2023-10-18'"])
      .groupBy("pla_uid");

    const sql = Selection.from(commentByUser, "t")
      .innerJoin(pla_user, "p", "p.pla_uid=t.uid")
      .select<CommentStat>("t.*, p.user_name, p.avatar")
      .where(["t.comment_total > 10"])
      .orderBy("comment_total DESC, t.uid ASC")
      .limit(+pageSize, page * +pageSize);

    const list = await this.query.queryRows(sql);

    return { list };
  }
}

export interface CommentStatByCount {
  uid: string;
  comment_total: number;
  user_name: string;
  avatar: string;
}

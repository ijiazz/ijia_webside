import { pla_comment, pla_user } from "@ijia/data/db";
import { Selection } from "@ijia/data/yoursql";
import { Controller, Get, PipeInput } from "@asla/hono-decorator";
import { CommentStatByCount } from "./stat.type.ts";
import { checkType, typeChecker } from "evlib";
const { optional } = typeChecker;

@Controller({ basePath: "/stat" })
export class CommentStat {
  constructor() {}
  @PipeInput(function (ctx) {
    const q = ctx.req.queries();
    const { value, error } = checkType(q, { page: optional.string, pageSize: optional.string });
    if (error) throw error;

    return [value];
  })
  @Get("comment/count_by_user")
  async getUserByCount(option: { page?: number | string; pageSize?: number | string } = {}) {
    const { page = 0, pageSize = 20 } = option;
    const commentByUser = pla_comment
      .select({ uid: "pla_uid", comment_total: "count(*)::INT" }, "t")
      .where(["root_comment_id IS NULL", "publish_time >'2023-10-18'"])
      .groupBy("pla_uid");

    const list = Selection.from(commentByUser, "t")
      .innerJoin(pla_user, "p", "p.pla_uid=t.uid")
      .select<CommentStatByCount>("t.*, p.user_name, p.avatar")
      .where(["t.comment_total > 10"])
      .orderBy("comment_total DESC, t.uid ASC")
      .limit(+pageSize, +page * +pageSize)
      .queryRows();

    return { list };
  }
}

import { Controller, Get, PipeInput } from "@asla/hono-decorator";
import { checkValue } from "@/global/check.ts";
import { GetListOption } from "@/dto/dto_common.ts";
import { optionalPositiveInt } from "@/global/check.ts";
import { getCommentCount } from "../sql/comment_stat.ts";

@Controller({ basePath: "/stat" })
export class CommentStat {
  constructor() {}
  @PipeInput(function (ctx) {
    const q = ctx.req.queries();
    return checkValue(q, { number: optionalPositiveInt, offset: optionalPositiveInt });
  })
  @Get("/live/stat/count_by_user")
  async getUserByCount(option: GetListOption) {
    const list = await getCommentCount(new Date("2023-10-18"), option);

    return { list };
  }
}
export const commentStatController = new CommentStat();

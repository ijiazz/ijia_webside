import { type DbPool, dbPool } from "@ijia/data/yoursql";
import { Get, PipeInput } from "@asla/hono-decorator";
import { getCommentList, getCommentReplyByCid } from "./pla_query.ts";
import type {
  GetCommentListParam,
  CommentRootItemDto,
  GetCommentReplyListParam,
  CommentReplyItemDto,
} from "./query.dto.ts";

interface DebugOption {
  sendSql?: (sql: string) => void;
}

export class BsQuery {
  constructor(private client: DbPool = dbPool) {}

  @PipeInput(function (ctx) {
    return ctx.req.param();
  })
  @Get("comment")
  async getCommentList(option: GetCommentListParam & DebugOption = {}): Promise<CommentRootItemDto[]> {
    return getCommentList(this.client, option);
  }
  @PipeInput(function (ctx) {
    return ctx.req.param();
  })
  @Get("comment_reply")
  async getCommentReplyByCid(option: GetCommentReplyListParam & DebugOption = {}): Promise<CommentReplyItemDto[]> {
    return getCommentReplyByCid(this.client, option);
  }
}

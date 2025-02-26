import { type DbPool, getDbPool } from "@ijia/data/yoursql";
import * as q from "@ijia/data/query";
import { Get, PipeInput } from "@asla/hono-decorator";

interface DebugOption {
  sendSql?: (sql: string) => void;
}

export class BsQuery {
  constructor(private client: DbPool = getDbPool()) {}

  @Get("published")
  async getAssetList(
    option: q.GetAssetListParam & { published_id?: string } & DebugOption = {},
  ): Promise<q.AssetItemDto[]> {
    return q.getAssetList(this.client, option);
  }

  @PipeInput(function (ctx) {
    return ctx.req.param();
  })
  @Get("comment")
  async getCommentList(option: q.GetCommentListParam & DebugOption = {}): Promise<q.CommentRootItemDto[]> {
    return q.getCommentList(this.client, option);
  }
  @PipeInput(function (ctx) {
    return ctx.req.param();
  })
  @Get("comment_reply")
  async getCommentReplyByCid(option: q.GetCommentReplyListParam & DebugOption = {}): Promise<q.CommentReplyItemDto[]> {
    return q.getCommentReplyByCid(this.client, option);
  }
}

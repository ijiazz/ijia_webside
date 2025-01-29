import { type DbPool, getDbPool } from "@ijia/data/yoursql";
import * as q from "@ijia/data/query";
import { Controller, Get, Param } from "@nestjs/common";

interface DebugOption {
  sendSql?: (sql: string) => void;
}

@Controller()
export class BsQuery {
  constructor(private client: DbPool = getDbPool()) {}

  @Get("published")
  async getAssetList(
    option: q.GetAssetListParam & { published_id?: string } & DebugOption = {},
  ): Promise<q.AssetItemDto[]> {
    return q.getAssetList(this.client, option);
  }

  @Get("comment")
  async getCommentList(
    @Param() option: q.GetCommentListParam & DebugOption = {},
  ): Promise<q.CommentRootItemDto[]> {
    return q.getCommentList(this.client, option);
  }
  @Get("comment_reply")
  async getCommentReplyByCid(
    @Param() option: q.GetCommentReplyListParam & DebugOption = {},
  ): Promise<q.CommentReplyItemDto[]> {
    return q.getCommentReplyByCid(this.client, option);
  }
}

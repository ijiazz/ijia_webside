export interface CommentApi {
  /** 获取根评论数量排行榜 */
  "GET /live/stat/count_by_user": {
    response: CommentStatByCount[];
    query: { page?: number; pageSize?: number };
  };
}
export interface CommentStatByCount {
  id: number;
  name: string;
  comment_total: number;
  avatar_url: string;
}

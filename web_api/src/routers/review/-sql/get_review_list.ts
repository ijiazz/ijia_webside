import { dbPool } from "@/db/client.ts";
import { ReviewItem, ReviewTargetType } from "@/dto.ts";
import { jsonb_build_object } from "@/global/sql_util.ts";
import { v } from "@/sql/utils.ts";
import { select } from "@asla/yoursql";
import { ReviewStatus } from "@ijia/data/db";

export type GetReviewListOption = {
  offset?: number;
  size: number;
  status?: ReviewStatus;
  type?: ReviewTargetType;
};
export function reviewSelect() {
  return select<ReviewItem<unknown>>({
    id: true,
    create_time: true,
    resolved_time: true,
    review_display: true,
    is_passed: true,
    is_reviewing: true,
    pass_count: true,
    reject_count: true,
    comment: true,
    reviewer: select(
      jsonb_build_object({
        avatar: true,
        nickname: true,
        user_id: "id",
      }),
    )
      .from("public.user")
      .where(`id=r.reviewer_id`)
      .toSelect(),
    target_type: true,
    info: true,
  }).from("review", { as: "r" });
}
async function getReviewList(option: GetReviewListOption): Promise<ReviewItem<unknown>[]> {
  const { size, offset, type, status } = option;
  const sql = reviewSelect()
    .where(() => {
      const condition: string[] = [];
      if (type) condition.push(`target_type=${v(type)}`);

      switch (status) {
        case ReviewStatus.passed:
          condition.push(`is_passed`);
          break;
        case ReviewStatus.rejected:
          condition.push(`NOT is_passed`);
          break;
        case ReviewStatus.pending:
          condition.push(`is_passed IS NULL`);
          break;
        default:
          break;
      }

      return condition;
    })
    .limit(size, offset);
  const list = await dbPool.queryRows(sql);
  return list;
}
export async function getReviewNext(type?: ReviewTargetType): Promise<ReviewItem<unknown> | undefined> {
  const next = await getReviewList({ type, size: 1, status: ReviewStatus.pending }); //TODO: 考虑给用户分配审核任务
  return next[0];
}

export async function getReviewItem(
  reviewId: number,
  type: ReviewTargetType,
): Promise<ReviewItem<unknown> | undefined> {
  const sql = reviewSelect().where([`id=${v(reviewId)}`, `target_type=${v(type)}`]);
  const [item] = await dbPool.queryRows(sql);
  return item;
}

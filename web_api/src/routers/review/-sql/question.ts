import { dbPool } from "@/db/client.ts";
import { QuestionAdvancedConfig, ReviewStatus, UpdateQuestionParam } from "@/dto.ts";
import { HttpError } from "@/global/errors.ts";
import { v } from "@/sql/utils.ts";
import { update } from "@asla/yoursql";
import { BECommitReviewParam } from "../-utils/commit.schema.ts";
import { updateQuestionForReview, updateQuestionAdvanceConfig } from "@/routers/question/mod.ts";

export async function commitAndUpdateQuestionReview(
  reviewerId: number,
  option: BECommitReviewParam,
  /** 提交审核并更新题目 */
  updateParam?: UpdateQuestionParam,
  /** 仅有 Admin 权限可以设置的高级配置 */
  advanced_config?: QuestionAdvancedConfig,
) {
  const { review_id: reviewId, is_passed: isPassed, remark } = option;

  const nextStatus = isPassed ? ReviewStatus.passed : ReviewStatus.rejected;
  const sqlUpdateReview = update("review")
    .set({
      resolved_time: "now()",
      is_passed: v(isPassed),
      is_reviewing: "FALSE",
      reviewer_id: v(reviewerId),
      comment: v(remark),
    })
    .where([`id=${v(reviewId)}`, `is_reviewing`])
    .returning<{ question_id: number }>("(info->>'target_id')::INT AS question_id");

  await using t = dbPool.begin("REPEATABLE READ");
  const [res] = await t.queryRows(sqlUpdateReview);

  if (!res) {
    throw new HttpError(400, "审核不存在或已被处理");
  }
  const question_id = res.question_id;
  if (updateParam) {
    await updateQuestionForReview(t, question_id, updateParam);
  }
  await updateQuestionAdvanceConfig(t, question_id, advanced_config, nextStatus);
  await t.commit();
  return true;
}

export function commitQuestionReview(reviewerId: number | string, option: BECommitReviewParam) {
  if (typeof reviewerId === "string") {
    reviewerId = parseInt(reviewerId, 10);
  }
  return commitAndUpdateQuestionReview(reviewerId, option);
}

import { checkValue } from "@/global/check.ts";
import routeGroup from "../_route.ts";
import { COMMIT_REVIEW_PARAM_SCHEMA } from "../-utils/commit.schema.ts";
import { requiredRoles, Role } from "@/middleware/auth.ts";
import { CommitReviewResult, ReviewTargetType } from "@/dto.ts";
import { commitAndUpdateQuestionReview } from "../-sql/question.ts";
import { getReviewNext } from "../-sql/get_review_list.ts";
import { optional } from "@asla/wokao";
import { ADVANCED_CONFIG_SCHEMA, UPDATE_QUESTION_PARAM_SCHEMA } from "@/routers/question/mod.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/review/commit/question",
  middlewares: [requiredRoles(Role.Admin)],
  async validateInput(ctx) {
    const { req } = ctx;
    const userInfo = ctx.get("userInfo");
    const reviewerId = await userInfo.getUserId();
    const json = await req.json();
    const param = checkValue(json, COMMIT_REVIEW_PARAM_SCHEMA);
    const update = checkValue(json.update, optional(UPDATE_QUESTION_PARAM_SCHEMA));
    const advancedConfig = checkValue(json.advanced_config, optional(ADVANCED_CONFIG_SCHEMA));
    return { param, update, advancedConfig, reviewerId };
  },
  async handler({ param, update, advancedConfig, reviewerId }): Promise<CommitReviewResult> {
    const success = await commitAndUpdateQuestionReview(reviewerId, param, update, advancedConfig);
    const next = await getReviewNext(ReviewTargetType.exam_question);
    return { next, success };
  },
});

import { ReviewTargetType } from "@/api.ts";
import { queryClient } from "@/request/client.ts";
import { getReviewNextQueryOption } from "@/request/review.ts";
import { getQuestionReviewNextQueryOption, QUESTION_REVIEW_ROUTE_TYPE } from "@/request/question.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/review/$type/")({
  params: {
    parse: (param: any): RouteParam => {
      const list = new Set<string>([ReviewTargetType.post, ReviewTargetType.post_comment, QUESTION_REVIEW_ROUTE_TYPE]);
      if (list.has(param.type)) {
        return { type: param.type as RouteParam["type"] };
      }
      throw new Error("type 参数错误");
    },
  },
  async loader({ params }) {
    if (params.type === QUESTION_REVIEW_ROUTE_TYPE) {
      await queryClient.fetchQuery(getQuestionReviewNextQueryOption());
      return;
    }
    await queryClient.fetchQuery(getReviewNextQueryOption({ type: params.type }));
  },
});
export type RouteParam = { type: ReviewTargetType | typeof QUESTION_REVIEW_ROUTE_TYPE };

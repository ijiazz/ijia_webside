import { ReviewTargetType } from "@/api.ts";
import { queryClient } from "@/request/client.ts";
import { getReviewNextQueryOption } from "@/request/review.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/review/$type")({
  params: {
    parse: (param): RouteParam => {
      const list = new Set([ReviewTargetType.post, ReviewTargetType.post_comment]);
      if (list.has(param.type as ReviewTargetType)) {
        return { type: param.type as ReviewTargetType };
      }
      throw new Error("type 参数错误");
    },
  },
  async loader({ params }) {
    await queryClient.fetchQuery(getReviewNextQueryOption({ type: ReviewTargetType.post }));
  },
});
export type RouteParam = { type: ReviewTargetType };

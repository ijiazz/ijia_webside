import { QueryOptions } from "@tanstack/react-query";
import { api } from "./client.ts";
import { ReviewTargetType } from "@ijia/api-types";

export const REVIEW_QUERY_KEY_PREFIX = "review";

export function getReviewNextQueryOption(param: { type: ReviewTargetType }) {
  return {
    queryKey: [REVIEW_QUERY_KEY_PREFIX, "/review/next/:type"],
    queryFn: () => {
      return api["/review/next/:type"].get({ params: param });
    },
  } satisfies QueryOptions;
}

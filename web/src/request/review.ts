import { QueryOptions } from "@tanstack/react-query";
import { api } from "./client.ts";
import { GetReviewNextResult, ReviewTargetType } from "@/api.ts";

export const REVIEW_QUERY_KEY_PREFIX = "review";

export function getReviewNextQueryOption<T = unknown>(param: { type: ReviewTargetType }) {
  return {
    queryKey: [REVIEW_QUERY_KEY_PREFIX, "/review/next/:type"],
    queryFn: (): Promise<GetReviewNextResult<T>> => {
      return api["/review/next/:type"].get({ params: param }) as Promise<GetReviewNextResult<T>>;
    },
  } satisfies QueryOptions;
}

import { QueryOptions } from "@tanstack/react-query";
import { api } from "./client.ts";
import { GetUserQuestionListParam } from "@/api.ts";

export const QUESTION_QUERY_KEY_PREFIX = "question";
export const QUESTION_REVIEW_ROUTE_TYPE = "question" as const;

export function getQuestionReviewNextQueryOption() {
  return {
    queryKey: [QUESTION_QUERY_KEY_PREFIX, "/question/review/next"],
    queryFn: () => api["/question/review/next"].get({}),
  } satisfies QueryOptions;
}

export function getUserQuestionList(param?: GetUserQuestionListParam) {
  return api["/question/list_user"].get({ query: param ?? {} });
}
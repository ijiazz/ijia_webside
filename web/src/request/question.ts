import { UseQueryOptions } from "@tanstack/react-query";
import { api } from "./client.ts";
import { GetUserQuestionListParam } from "@/api.ts";

export const QUESTION_QUERY_KEY_PREFIX = "question";

export function getUserQuestionListQueryOption(param: GetUserQuestionListParam) {
  return api["/question/list_user"].get({ query: param });
}
export function getQuestionDetailQueryOption(questionId: string) {
  return {
    queryKey: [QUESTION_QUERY_KEY_PREFIX, "question_detail", questionId],
    queryFn: () =>
      api["/question/entity/:question_id"].get({ params: { question_id: questionId } }).then((res) => res.item),
  } satisfies UseQueryOptions;
}
export function getQuestionDetailForReviewQueryOption(reviewId: string) {
  return {
    queryKey: [QUESTION_QUERY_KEY_PREFIX, "review_question_detail", reviewId],
    queryFn: () => {
      if (!reviewId) return Promise.resolve(null);
      return api["/question/review_get/:review_id"].get({ params: { review_id: reviewId } }).then((res) => res.item);
    },
  } satisfies UseQueryOptions;
}
export function getGlobalQuestionStatQueryOption() {
  return {
    queryKey: [QUESTION_QUERY_KEY_PREFIX, "global_question_stat"],
    queryFn: () => {
      return api["/question/public_stats"].get();
    },
  } satisfies UseQueryOptions;
}

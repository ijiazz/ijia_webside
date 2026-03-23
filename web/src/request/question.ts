import { UseQueryOptions } from "@tanstack/react-query";
import { api } from "./client.ts";
import { GetUserQuestionListParam } from "@/api.ts";

export const QUESTION_QUERY_KEY_PREFIX = "question";

export function getUserQuestionList(param: GetUserQuestionListParam) {
  return api["/question/list_user"].get({ query: param });
}
export function getQuestionDetail(questionId: string) {
  return {
    queryKey: [QUESTION_QUERY_KEY_PREFIX, "question_detail", questionId],
    queryFn: () =>
      api["/question/entity/:question_id"].get({ params: { question_id: questionId } }).then((res) => res.item),
  } satisfies UseQueryOptions;
}

import { QueryOptions } from "@tanstack/react-query";
import { api } from "./client.ts";
import { GetPostListParam, GetSelfPostListParam } from "@/api.ts";

export const POST_QUERY_KEY_PREFIX = "post";

export const PublicPostGroupOption = {
  queryKey: [POST_QUERY_KEY_PREFIX, "/post/group/list"],
  queryFn: () => api["/post/group/list"].get(),
} satisfies QueryOptions;

export function getPostListQueryOption(param: Omit<GetPostListParam, "cursor" | "forward">) {
  return {
    queryKey: [POST_QUERY_KEY_PREFIX, "/post/list"],
    queryFn: () => api["/post/list"].get({ query: param }),
  } satisfies QueryOptions;
}

export function getShelfPostListQueryOption(param: Omit<GetSelfPostListParam, "cursor" | "forward">) {
  return {
    queryKey: [POST_QUERY_KEY_PREFIX, "/post/self/list"],
    queryFn: () => api["/post/self/list"].get({ query: param }),
  } satisfies QueryOptions;
}

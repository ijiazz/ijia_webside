import { QueryOptions } from "@tanstack/react-query";
import { api } from "./client.ts";
import { GetPostListParam } from "@/api.ts";

export const POST_QUERY_KEY_PREFIX = "post";

export function getPublicPostGroupOption() {
  return {
    queryKey: [POST_QUERY_KEY_PREFIX, "/post/group/list"],
    queryFn: () => api["/post/group/list"].get(),
  } satisfies QueryOptions;
}

export function getPostListQueryOption(param: Omit<GetPostListParam, "cursor" | "forward">) {
  return {
    queryKey: [POST_QUERY_KEY_PREFIX, "/post/list"],
    queryFn: () => api["/post/list"].get({ query: param }),
  } satisfies QueryOptions;
}

export function getPostQueryOption(param: { postId: number }) {
  return {
    queryKey: [POST_QUERY_KEY_PREFIX, "/post/user"],
    queryFn: () => api["/post/entity/:postId"].get({ params: param }),
  } satisfies QueryOptions;
}

import { QueryOptions, UseInfiniteQueryOptions, InfiniteData } from "@tanstack/react-query";
import { api } from "./client.ts";
import { GetPostListParam, GetSelfPostListParam, PostResponse, PostSelfResponse } from "@/api.ts";

export const POST_QUERY_KEY_PREFIX = "post";

export const PublicPostGroupOption = {
  queryKey: [POST_QUERY_KEY_PREFIX, "/post/group/list"],
  queryFn: () => api["/post/group/list"].get(),
} satisfies QueryOptions;

export function getPostListInfiniteQueryOption(param: Omit<GetPostListParam, "cursor" | "forward">) {
  return {
    queryKey: [POST_QUERY_KEY_PREFIX, "/post/group/list"],
    queryFn: (ctx) => {
      ctx.pageParam;
      return api["/post/list"].get({ query: param });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => getCursorParam(lastPage.cursor_next),
    getPreviousPageParam: (firstPage) => getCursorParam(firstPage.cursor_prev, true),
    gcTime: 0,
  } satisfies UseInfiniteQueryOptions<
    PostResponse,
    unknown,
    InfiniteData<PostResponse>,
    unknown[],
    { cursor: string; forward?: boolean } | undefined
  >;
}

function getCursorParam(cursor?: string | null, forward?: boolean) {
  if (!cursor) return undefined;
  return { cursor, forward };
}
export function getShelfPostListQueryOption(param: GetSelfPostListParam) {
  return {
    queryKey: [POST_QUERY_KEY_PREFIX, "/post/group/list"],
    queryFn: () => {
      return api["/post/self/list"].get({ query: param });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => getCursorParam(lastPage.cursor_next),
    getPreviousPageParam: (firstPage) => getCursorParam(firstPage.cursor_prev, true),
    gcTime: 0,
  } satisfies UseInfiniteQueryOptions<PostSelfResponse, unknown, InfiniteData<PostSelfResponse>>;
}

export function replaceInfiniteData<T>(
  data: InfiniteData<T>,
  replacer: (item: T, index: number) => T,
): InfiniteData<T> {
  return {
    ...data,
    pages: data.pages.map(replacer),
  };
}

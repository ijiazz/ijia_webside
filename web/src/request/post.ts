import { QueryOptions } from "@tanstack/react-query";
import { api } from "./client.ts";

export const POST_QUERY_KEY_PREFIX = "post";

export const PublicPostGroupOption = {
  queryKey: [POST_QUERY_KEY_PREFIX, "/post/group/list"],
  queryFn: () => api["/post/group/list"].get(),
} satisfies QueryOptions;

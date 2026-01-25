import { QueryOptions } from "@tanstack/react-query";
import { api } from "./client.ts";
export const CLASS_QUERY_KEY_PREFIX = "class";

export const PublicClassListQueryOption = {
  queryKey: [CLASS_QUERY_KEY_PREFIX, "/public/class/list"],
  queryFn: () => api["/class/public"].get(),
} satisfies QueryOptions;

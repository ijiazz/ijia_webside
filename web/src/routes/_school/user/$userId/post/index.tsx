import { checkTypeCopy, integer, optional } from "@asla/wokao";
import { createFileRoute } from "@tanstack/react-router";

const SearchSchema = {
  openCommentPostId: optional(integer({ acceptString: true })),
  openPublish: optional(integer({ acceptString: true })),
};
export type RouteSearch = {
  openCommentPostId?: number;
  openPublish?: number;
};

export const Route = createFileRoute("/_school/user/$userId/post/")({
  validateSearch: (searchRaw): RouteSearch => checkTypeCopy(searchRaw, SearchSchema, { policy: "pass" }),
});

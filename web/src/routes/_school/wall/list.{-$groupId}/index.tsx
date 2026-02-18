import { createFileRoute } from "@tanstack/react-router";
import { checkTypeCopy, integer, optional } from "@asla/wokao";

const SearchSchema = {
  openCommentPostId: optional(integer({ acceptString: true })),
};
export type RouteSearch = {
  openCommentPostId?: number;
};

export const Route = createFileRoute("/_school/wall/list/{-$groupId}/")({
  validateSearch(searchRaw): RouteSearch {
    return checkTypeCopy(searchRaw, SearchSchema);
  },
});

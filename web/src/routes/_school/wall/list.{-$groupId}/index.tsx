import { createFileRoute } from "@tanstack/react-router";
import { checkTypeCopy, ExpectType, optional } from "@asla/wokao";

const SearchSchema = {
  openCommentPostId: optional((input) => String(input)),
} satisfies ExpectType;
export type RouteSearch = {
  openCommentPostId?: string;
};

export const Route = createFileRoute("/_school/wall/list/{-$groupId}/")({
  validateSearch(searchRaw): RouteSearch {
    return checkTypeCopy(searchRaw, SearchSchema, { policy: "pass" });
  },
});

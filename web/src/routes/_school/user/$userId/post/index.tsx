import { checkTypeCopy, ExpectType, integer, optional } from "@asla/wokao";
import { createFileRoute } from "@tanstack/react-router";

const SearchSchema = {
  openCommentPostId: optional.string,
  openPublish: optional(integer({ acceptString: true })),
} satisfies ExpectType;

export type RouteSearch = {
  openCommentPostId?: string;
  openPublish?: number;
};
export const Route = createFileRoute("/_school/user/$userId/post/")({
  validateSearch: (searchRaw): RouteSearch => checkTypeCopy(searchRaw, SearchSchema, { policy: "pass" }),
});

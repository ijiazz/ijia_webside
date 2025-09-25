import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/wall/list/{-$groupId}/")({
  validateSearch(searchRaw) {
    const idStr = searchRaw.openCommentPostId as string;
    return {
      openCommentPostId: idStr ? Number.parseInt(idStr) : undefined,
    };
  },
});

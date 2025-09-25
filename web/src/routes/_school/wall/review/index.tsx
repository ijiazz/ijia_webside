import { PostReviewItemDto } from "@/api.ts";
import { api } from "@/common/http.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/wall/review/")({
  loader(ctx): Promise<PostReviewItemDto | undefined> {
    return api["/post/review/next"].get();
  },
});

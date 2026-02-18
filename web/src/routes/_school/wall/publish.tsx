import { queryClient } from "@/request/client.ts";
import { getPublicPostGroupOption } from "@/request/post.ts";
import { getCurrentUserInfoQueryOption } from "@/request/user.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/wall/publish")({
  async loader(ctx) {
    const [user, groupOptions] = await Promise.all([
      queryClient.ensureQueryData(getCurrentUserInfoQueryOption()),
      queryClient.ensureQueryData(getPublicPostGroupOption()),
    ]);
    return { user };
  },
});

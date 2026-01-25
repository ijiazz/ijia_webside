import { createFileRoute } from "@tanstack/react-router";
import { queryClient } from "@/request/client.ts";
import { PublicPostGroupOption } from "@/request/post.ts";

export const Route = createFileRoute("/_school/wall/list/{-$groupId}")({
  async loader(ctx) {
    const postGroup = await queryClient.ensureQueryData(PublicPostGroupOption);

    return {
      postGroup,
    };
  },
  shouldReload: (ctx) => ctx.cause === "enter",
});

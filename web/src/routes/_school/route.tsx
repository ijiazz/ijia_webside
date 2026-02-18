import { queryClient } from "@/request/client.ts";
import { createFileRoute } from "@tanstack/react-router";
import { getCurrentUserInfoQueryOption } from "@/request/user.ts";
import { User } from "@/api.ts";

export const Route = createFileRoute("/_school")({
  async loader(ctx): Promise<LoaderData> {
    const userInfo = await queryClient
      .ensureQueryData(getCurrentUserInfoQueryOption({ ignoreUnAuthorizeRedirect: true }))
      .catch(() => null);

    return {
      userInfo,
    };
  },
});

export type LoaderData = {
  userInfo: User | null;
};

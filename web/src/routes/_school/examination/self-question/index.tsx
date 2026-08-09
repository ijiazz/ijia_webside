import { queryClient } from "@/request/client.ts";
import { getCurrentUserInfoQueryOption } from "@/request/user.ts";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_school/examination/self-question/")({
  async beforeLoad() {
    try {
      await queryClient.ensureQueryData(getCurrentUserInfoQueryOption({ ignoreUnAuthorizeRedirect: true }));
    } catch {
      throw notFound();
    }
  },
});

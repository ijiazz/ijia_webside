import { createFileRoute, Outlet } from "@tanstack/react-router";
import { UserWall } from "../-components/UserWall.tsx";
import { css } from "@emotion/css";
import { queryClient } from "@/request/client.ts";
import { getPublicPostGroupOption } from "@/request/post.ts";
import { PostGroupItem } from "@/api.ts";

export const Route = createFileRoute("/_school/user/$userId")({
  component: RouteComponent,
  async loader(ctx): Promise<LoaderData> {
    const { items } = await queryClient.ensureQueryData(getPublicPostGroupOption());
    return {
      publicPostGroup: items,
    };
  },
  shouldReload: (ctx) => ctx.cause === "enter",
});
export type LoaderData = {
  publicPostGroup: PostGroupItem[];
};
function RouteComponent() {
  return (
    <div className={UserLayout}>
      <UserWall />
      <Outlet />
    </div>
  );
}
const UserLayout = css``;

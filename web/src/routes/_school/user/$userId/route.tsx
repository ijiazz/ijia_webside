import { createFileRoute, Outlet } from "@tanstack/react-router";
import { UserWall } from "../-components/UserWall.tsx";
import { css } from "@emotion/css";
import { queryClient } from "@/request/client.ts";
import { getPublicPostGroupOption } from "@/request/post.ts";
import { PostGroupItem } from "@/api.ts";
import { Tabs, TabsProps } from "antd";

export const Route = createFileRoute("/_school/user/$userId")({
  component: RouteComponent,
  async loader(ctx): Promise<LoaderData> {
    const [{ items }] = await Promise.all([queryClient.ensureQueryData(getPublicPostGroupOption())]);
    return {
      publicPostGroup: items,
    };
  },
  params: {
    parse: (value) => {
      const { userId } = value;
      if (userId && !Number.isInteger(Number.parseInt(userId))) {
        throw new Error("userId must be an integer");
      }
      return value;
    },
  },
  shouldReload: (ctx) => ctx.cause === "enter",
});
export type LoaderData = {
  publicPostGroup: PostGroupItem[];
};
function RouteComponent() {
  const tabs: TabsProps["items"] = [
    {
      key: "post",
      label: "帖子",
    },
  ];
  return (
    <div>
      <UserWall classNames={{ userInfoCard: Padding }} />
      <Tabs items={tabs} className={Padding} />
      <Outlet />
    </div>
  );
}
const Padding = css`
  --padding: 48px;
  padding-left: var(--padding);
  padding-right: var(--padding);
  @media (max-width: 700px) {
    --padding: 12px;
  }
`;

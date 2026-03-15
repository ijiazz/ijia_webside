import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { UserWall } from "../-components/UserWall.tsx";
import { css } from "@emotion/css";
import { queryClient } from "@/request/client.ts";
import { getPublicPostGroupOption } from "@/request/post.ts";
import { PostGroupItem, User } from "@/api.ts";
import { Tabs, TabsProps } from "antd";
import { getUserInfoQueryOption } from "@/request/user.ts";
import { checkTypeCopy, integer } from "@asla/wokao";

export const Route = createFileRoute("/_school/user/$userId")({
  component: RouteComponent,
  async loader(ctx): Promise<LoaderData> {
    const { userId } = ctx.params;
    const [{ items }, user] = await Promise.all([
      queryClient.ensureQueryData(getPublicPostGroupOption()),
      queryClient.ensureQueryData(getUserInfoQueryOption({ userId })),
    ]);
    return {
      publicPostGroup: items,
      user,
    };
  },
  params: {
    parse: (value) => {
      checkTypeCopy(value, {
        userId: integer({ acceptString: true }),
      });
      return value;
    },
  },
  shouldReload: (ctx) => ctx.cause === "enter",
});
export type LoaderData = {
  publicPostGroup: PostGroupItem[];
  user: User;
};
function RouteComponent() {
  const { user } = Route.useLoaderData();
  const { userId } = Route.useParams();
  const navigate = Route.useNavigate();
  const location = useLocation();
  const tabs: TabsProps["items"] = [
    {
      key: "post",
      label: "帖子",
    },
    {
      key: "question",
      label: "题目",
    },
  ];
  const activeKey = location.pathname.includes("/question") ? "question" : "post";
  return (
    <div>
      <UserWall user={user} classNames={{ userInfoCard: Padding }} />
      <Tabs
        items={tabs}
        className={Padding}
        activeKey={activeKey}
        onChange={(key) => {
          navigate({
            to: key === "question" ? "/user/$userId/question" : "/user/$userId/post",
            params: { userId },
          });
        }}
      />
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

import { createLazyFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { PublishPost } from "../-components/WallPost/PublishPost.tsx";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getPublicPostGroupOption } from "@/request/post.ts";

export const Route = createLazyFileRoute("/_school/wall/publish")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const goToUserPost = () => {
    navigate({
      to: "/user/$userId/post",
      params: { userId: user.user_id.toString() },
      viewTransition: true,
    });
  };
  const onBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      goToUserPost();
    }
  };
  const { data: option, isFetching: loading } = useSuspenseQuery({
    ...getPublicPostGroupOption(),
    select({ items }) {
      return items.map((item) => ({ label: item.group_name, value: item.group_id, desc: item.rule_desc }));
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回
        </Button>
      </div>
      <div style={{ padding: "12px", flex: 1, overflow: "auto" }}>
        <PublishPost onCreateOk={goToUserPost} onEditOk={onBack} groupOptions={option} groupLoading={loading} />
      </div>
    </div>
  );
}

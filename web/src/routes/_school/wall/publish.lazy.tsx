import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "@/request/client.ts";
import { useAsync } from "@/hooks/async.ts";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React from "react";
import { PublishPost } from "../-components/WallPost/PublishPost.tsx";

export const Route = createLazyFileRoute("/_school/wall/publish")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const onBack = () => {
    navigate({ to: "..", viewTransition: true });
  };

  const { loading, data: option } = useAsync(
    async () => {
      const { items } = await api["/post/group/list"].get();

      return items.map((item) => ({ label: item.group_name, value: item.group_id, desc: item.rule_desc }));
    },
    { autoRunArgs: [] },
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回
        </Button>
      </div>
      <div style={{ padding: "12px", flex: 1, overflow: "auto" }}>
        <PublishPost
          onCreateOk={() => {
            navigate({ href: "/wall/list/self", viewTransition: true });
          }}
          groupOptions={option}
          groupLoading={loading}
        />
      </div>
    </div>
  );
}

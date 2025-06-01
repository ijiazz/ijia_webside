import { PostGroupResponse } from "@/api.ts";
import { Menu, MenuProps } from "antd";
import React, { useMemo } from "react";
import { Outlet, useLoaderData, useNavigate, useParams } from "react-router";

export function PostLayout() {
  const data = useLoaderData<PostGroupResponse | undefined>();
  const { groupId } = useParams();
  console.log(groupId);
  const navigate = useNavigate();
  const changeGroupId = (id?: string) => {
    if (id === groupId) return; // 如果当前分组已选中，则不进行任何操作
    let base = groupId ? "../" : "";
    console.log(id, base);
    if (typeof id !== "string") {
      navigate(base, {});
    } else {
      navigate(base + id, {});
    }
  };
  const menus = useMemo(() => {
    const menus: MenuProps["items"] = data?.items.map((item) => ({
      key: item.group_id.toString(),
      label: item.group_name,
    }));
    return menus;
  }, [data]);
  return (
    <div style={{ display: "flex" }}>
      <Menu
        items={menus}
        activeKey={groupId}
        onClick={(e) => {
          changeGroupId(e.keyPath[0]);
        }}
      />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

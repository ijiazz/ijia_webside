import { PostGroupResponse } from "@/api.ts";
import { useThemeToken } from "@/hooks/antd.ts";
import { Menu, MenuProps } from "antd";
import React, { useMemo } from "react";
import { Outlet, useLoaderData, useNavigate, useParams } from "react-router";

export function PostLayout() {
  const data = useLoaderData<PostGroupResponse | undefined>();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const changeGroupId = (id?: string) => {
    if (id === groupId) return; // 如果当前分组已选中，则不进行任何操作
    if (typeof id !== "string" || id === "all") {
      navigate(".");
    } else {
      navigate(id);
    }
  };
  const theme = useThemeToken();
  const menus = useMemo(() => {
    const menus: MenuProps["items"] = data?.items.map((item) => ({
      key: item.group_id.toString(),
      label: item.group_name,
    }));
    menus?.unshift({
      key: "all",
      label: "全部",
    });
    return menus;
  }, [data]);
  return (
    <div style={{ display: "flex", minHeight: "100%" }}>
      <Menu
        style={{ minWidth: "150px", backgroundColor: theme.colorBgLayout }}
        items={menus}
        selectedKeys={[groupId || "all"]}
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

import { PostGroupResponse } from "@/api.ts";
import { AdaptiveMenuLayout, LayoutDirection } from "@/modules/layout/AdaptiveMenuLayout.tsx";
import { Button, ButtonProps, Menu, MenuProps, Result } from "antd";
import React, { useMemo } from "react";
import { Outlet, useLoaderData, useLocation, useNavigate, useParams } from "react-router";
import styled from "@emotion/styled";
import { getUserInfoFromToken } from "@/common/user.ts";
import { PlusOutlined } from "@ant-design/icons";
import { ROUTES } from "@/app.ts";
export type PostGroupContextType = {
  groupId: number;
  groupName: string;
};
export const CurrentPostGroupContext = React.createContext<PostGroupContextType | null>(null);

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

  const currentGroup = useMemo((): PostGroupContextType | null => {
    if (!data || !groupId) return null;
    const current = data.items.find((item) => item.group_id.toString() === groupId);
    if (!current) return null;
    return {
      groupId: current.group_id,
      groupName: current.group_name,
    };
  }, [data, groupId]);

  if (!data)
    return (
      <Result
        status="error"
        title="加载分组数据失败"
        subTitle="你可以尝试刷新"
        extra={<Button type="link">刷新页面</Button>}
      />
    );
  if (data.items.length === 0) return <Outlet />;
  return (
    <AdaptiveMenuLayout
      style={{ height: "100%" }}
      menu={(direction) => {
        const isVertical = direction === LayoutDirection.Vertical;
        const menu = (
          <Menu
            mode={isVertical ? "horizontal" : "vertical"}
            style={{
              minWidth: "150px",
              height: "100%",
              backgroundColor: isVertical ? undefined : "#0000",
            }}
            items={menus}
            selectedKeys={[groupId || "all"]}
            activeKey={groupId}
            onClick={(e) => {
              changeGroupId(e.keyPath[0]);
            }}
          />
        );

        return (
          <NavigationTabCSS isVertical={isVertical}>
            {menu}
            <PublishBtn style={{ marginRight: 12, display: isVertical ? undefined : "none" }} type="text"></PublishBtn>
          </NavigationTabCSS>
        );
      }}
    >
      <CurrentPostGroupContext.Provider value={currentGroup}>
        <Outlet />
      </CurrentPostGroupContext.Provider>
    </AdaptiveMenuLayout>
  );
}

function PublishBtn(props: Omit<ButtonProps, "onClick" | "icon">) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Button
      {...props}
      icon={<PlusOutlined />}
      type="text"
      onClick={() => {
        if (getUserInfoFromToken()?.valid) {
          navigate("publish");
        } else {
          navigate(ROUTES.Login + `?redirect=${location.pathname}`);
        }
      }}
    />
  );
}

const NavigationTabCSS = styled.div<{ isVertical: boolean }>`
  ${(props) =>
    props.isVertical
      ? `
  display:flex;
  gap:8px;
  justify-content: space-between;
  align-items: center;
  `
      : ""}
`;

import { PostGroupItem, PostGroupResponse } from "@/api.ts";
import { AdaptiveMenuLayout, LayoutDirection } from "@/modules/layout/AdaptiveMenuLayout.tsx";
import { Button, ButtonProps, ConfigProvider, ConfigProviderProps, Menu, MenuProps, Result } from "antd";
import React, { useMemo } from "react";
import { Outlet, useLoaderData, useLocation, useNavigate, useParams } from "react-router";
import styled from "@emotion/styled";
import { getUserInfoFromToken } from "@/common/user.ts";
import { PlusOutlined } from "@ant-design/icons";
import { ROUTES } from "@/app.ts";
export type PostQueryFilter = {
  group?: PostGroupItem;
  self?: boolean;
};
export const PostQueryFilterContext = React.createContext<PostQueryFilter>({});

const THEME: ConfigProviderProps["theme"] = {
  cssVar: true,

  token: {
    colorPrimary: "#f1a2a8",
    colorInfo: "#f1a2a8",
    colorSuccess: "#1faabd",
    colorWarning: "#fccf52",
    colorError: "#c12d39",
  },
};
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
    const menus: MenuProps["items"] =
      data?.items.map((item) => ({
        key: item.group_id.toString(),
        label: item.group_name,
      })) ?? [];

    const info = getUserInfoFromToken();

    if (info?.valid) {
      menus.unshift({ key: "self", label: "我的" });
    }
    menus.unshift({ key: "all", label: "全部" });

    return menus;
  }, [data]);

  const filter = useMemo((): PostQueryFilter => {
    if (!data || !groupId) return {};
    const isSelf = groupId === "self";
    if (isSelf) {
      return {
        self: true,
      };
    }
    const current = data.items.find((item) => item.group_id.toString() === groupId);
    if (!current) return {};
    return {
      group: current,
    };
  }, [data, groupId]);

  if (!data)
    return (
      <Result
        status="error"
        title="加载分组数据失败"
        subTitle="你可以尝试刷新"
        extra={
          <Button type="link" onClick={() => location.reload()}>
            刷新页面
          </Button>
        }
      />
    );
  return (
    <ConfigProvider theme={THEME}>
      <AdaptiveMenuLayout
        style={{ height: "100%" }}
        menu={(direction) => {
          const isVertical = direction === LayoutDirection.Vertical;
          const menu = (
            <Menu
              mode={isVertical ? "horizontal" : "vertical"}
              style={{
                flex: 1,
                minWidth: "150px",
                height: "100%",
                backgroundColor: isVertical ? undefined : "#0000",
              }}
              items={menus}
              selectedKeys={[groupId || "all"]}
              onClick={(e) => {
                changeGroupId(e.keyPath[0]);
              }}
            />
          );

          return (
            <NavigationTabCSS isVertical={isVertical}>
              {menu}
              <PublishBtn
                className="e2e-publish-post-btn"
                style={{ marginRight: 12, display: isVertical ? undefined : "none" }}
                type="text"
              ></PublishBtn>
            </NavigationTabCSS>
          );
        }}
      >
        <PostQueryFilterContext.Provider value={filter}>
          <Outlet />
        </PostQueryFilterContext.Provider>
      </AdaptiveMenuLayout>
    </ConfigProvider>
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
          navigate("/wall/publish");
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

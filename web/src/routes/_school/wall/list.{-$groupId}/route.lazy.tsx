import { createLazyFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { PostGroupResponse } from "@/api.ts";
import { Button, ButtonProps, ConfigProvider, ConfigProviderProps, MenuProps, Result } from "antd";
import React, { useMemo } from "react";
import { getUserInfoFromToken } from "@/common/user.ts";
import { PlusOutlined } from "@ant-design/icons";
import { ROUTES } from "@/app.ts";
import { AdaptiveMenuLayout } from "@/routes/-layout/AdaptiveMenuLayout.tsx";
import { AntdStaticProvider, LayoutDirection, useLayoutDirection } from "@/provider/mod.tsx";
import { PostQueryFilter, PostQueryFilterContext } from "./-components/PostQueryFilterContext.tsx";

export const Route = createLazyFileRoute("/_school/wall/list/{-$groupId}")({
  component: PostLayout,
});

const THEME: ConfigProviderProps["theme"] = {
  token: {
    colorPrimary: "#f1a2a8",
    colorInfo: "#f1a2a8",
    colorSuccess: "#1faabd",
    colorWarning: "#fccf52",
    colorError: "#c12d39",
  },
};
function PostLayout() {
  const data: PostGroupResponse | undefined = Route.useLoaderData();
  const matchPathname = Route.useMatch({ select: (m) => m.pathname });
  const { groupId } = Route.useParams();

  const navigate = useNavigate();
  const changeGroupId = (id?: string) => {
    if (id === groupId) return; // 如果当前分组已选中，则不进行任何操作
    if (typeof id !== "string" || id === "all") {
      if (groupId === undefined) return;
      navigate({ from: matchPathname, to: "..", viewTransition: true });
    } else {
      navigate({ from: matchPathname, to: groupId === undefined ? id : "../" + id, viewTransition: true });
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
  const isVertical = useLayoutDirection() === LayoutDirection.Vertical;
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
      <AntdStaticProvider>
        <AdaptiveMenuLayout
          style={{
            minWidth: "150px",
            height: "100%",
          }}
          items={menus}
          selectedKeys={[groupId || "all"]}
          onClick={(e) => {
            changeGroupId(e.keyPath[0]);
          }}
          rightExtra={
            <PublishBtn
              className="e2e-publish-post-btn"
              style={{ marginRight: 12, display: isVertical ? undefined : "none" }}
              type="text"
            ></PublishBtn>
          }
        >
          <PostQueryFilterContext.Provider value={filter}>
            <Outlet />
          </PostQueryFilterContext.Provider>
        </AdaptiveMenuLayout>
      </AntdStaticProvider>
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
          navigate({ to: "/wall/publish", viewTransition: true });
        } else {
          navigate({ href: ROUTES.Login + `?redirect=${location.pathname}`, viewTransition: true });
        }
      }}
    />
  );
}

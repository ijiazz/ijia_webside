import React, { PropsWithChildren } from "react";
import { ProLayout, ProLayoutProps } from "@ant-design/pro-components";
import { IjiaLogo } from "../../common/site-logo.tsx";
import { Button, MenuProps } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { menus } from "./menus.tsx";
import { getUserToken, useCurrentUser } from "@/common/user.ts";
import { avatarDropdownRender } from "./avatar.tsx";
import { useAntdStatic } from "@/global-provider.tsx";
import styled from "@emotion/styled";
import { ROUTES } from "@/app.ts";

function LayoutBase(
  props: PropsWithChildren<{ avatarProps?: ProLayoutProps["avatarProps"]; action?: React.ReactNode }>,
) {
  const { children = <Outlet />, action } = props;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  function onMenuSelect(item: Parameters<NonNullable<MenuProps["onSelect"]>>[0]) {
    let path = item.key;
    if (path) navigate(path, { viewTransition: true });
  }
  return (
    <ProLayoutCSS
      disableMobile
      token={{ pageContainer: { paddingBlockPageContainerContent: 0, paddingInlinePageContainerContent: 0 } }}
      onMenuHeaderClick={() => navigate(ROUTES.Home, { viewTransition: true })}
      logo={<IjiaLogo />}
      title="IJIA 学院"
      route={menus}
      location={{
        pathname: pathname,
      }}
      actionsRender={
        action
          ? (props) => {
              if (props.isMobile) return [];
              return action;
            }
          : undefined
      }
      avatarProps={props.avatarProps}
      layout="mix"
      splitMenus
      menuProps={{
        onSelect: onMenuSelect,
      }}
    >
      {children}
    </ProLayoutCSS>
  );
}
const ProLayoutCSS = styled(ProLayout)`
  height: 100%;
  .ant-layout {
    height: 100%;
  }
  .ant-pro-layout-container {
    min-height: 100%;
  }
  @media (max-width: 600px) {
    .ant-pro-top-nav-header-logo {
      h1 {
        display: none;
      }
    }
    .ant-pro-global-header-header-actions-avatar {
      .ant-avatar + span {
        display: none;
      }
    }
  }
  @media (max-width: 400px) {
    .ant-pro-top-nav-header-logo {
      display: none;
    }
  }
`;
const IS_DEV = import.meta.env?.DEV;
export function UserLayout(props: PropsWithChildren<{}>) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout, value: user } = useCurrentUser();
  const { message } = useAntdStatic();
  const copyToken = () => {
    const url = new URL(location.href);
    const token = getUserToken();
    if (token) {
      url.searchParams.set("access_token", token);
      const tokenUrl = url.toString();
      navigator.clipboard.writeText(tokenUrl);
    }
    message.success("已复制");
  };
  return (
    <LayoutBase
      avatarProps={
        user
          ? {
              src: user.avatar_url,
              className: "e2e-avatar",
              size: "small",
              title: user?.nickname,
              render: (props, dom) => {
                return avatarDropdownRender(dom, {
                  navigate: (to) => navigate(to, { viewTransition: true }),
                  onLogout: logout,
                });
              },
              children: user.nickname ?? " ",
            }
          : {
              className: "e2e-avatar",
              size: "small",
              title: "登录",
              onClick: () => {
                navigate("/passport/login", { viewTransition: true });
              },
              render: (props, dom) => {
                return (
                  <Link style={{ color: "inherit" }} to={"/passport/login?redirect=" + pathname} viewTransition>
                    {dom}
                  </Link>
                );
              },
            }
      }
      action={IS_DEV && user ? <Button onClick={copyToken}>复制token</Button> : undefined}
    >
      {props.children}
    </LayoutBase>
  );
}

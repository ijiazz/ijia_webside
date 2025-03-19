import { PropsWithChildren } from "react";
import { ProLayout, ProLayoutProps } from "@ant-design/pro-components";
import { IjiaLogo } from "../../common/site-logo.tsx";
import { MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import { menus } from "./menus.ts";
import { gotoHome } from "@/common/navigation.ts";
import { useCurrentUser } from "@/common/user.ts";
import { avatarDropdownRender } from "./avatar.tsx";

function LayoutBase(props: PropsWithChildren<{ avatarProps?: ProLayoutProps["avatarProps"] }>) {
  const { children = <Outlet /> } = props;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  function onMenuSelect(item: Parameters<NonNullable<MenuProps["onSelect"]>>[0]) {
    let path = item.key;
    if (path) navigate(path);
  }
  return (
    <ProLayout
      onMenuHeaderClick={gotoHome}
      logo={<IjiaLogo />}
      title="IJIA 学院"
      route={menus}
      location={{
        pathname: pathname,
      }}
      avatarProps={props.avatarProps}
      layout="mix"
      splitMenus
      menuProps={{
        onSelect: onMenuSelect,
      }}
    >
      {children}
    </ProLayout>
  );
}
export function UserLayout(props: PropsWithChildren<{}>) {
  const navigate = useNavigate();
  const { logout, value: user } = useCurrentUser();
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
                return avatarDropdownRender(dom, { navigate, onLogout: logout });
              },
              children: user.nickname ?? " ",
            }
          : undefined
      }
    >
      {props.children}
    </LayoutBase>
  );
}

import { PropsWithChildren } from "react";
import { ProLayout, ProLayoutProps } from "@ant-design/pro-components";
import { IjiaLogo } from "../../common/site-logo.tsx";
import { MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import { menus } from "./menus.ts";
import { gotoHome } from "@/common/navigation.ts";

export function LayoutBase(props: PropsWithChildren<{ avatarProps?: ProLayoutProps["avatarProps"] }>) {
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
export const PublicLayout = LayoutBase;

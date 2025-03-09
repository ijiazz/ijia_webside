import { PropsWithChildren } from "react";
import { ProLayout } from "@ant-design/pro-components";
import { IjiaLogo } from "../site-logo.tsx";
import { MenuProps } from "antd";
import { useLocation, useNavigate } from "react-router";
import { menus } from "./menus.ts";
import { avatarDropdownRender } from "./avatar.tsx";

export function TabHeader(props: PropsWithChildren<{}>) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  function onMenuSelect(item: Parameters<NonNullable<MenuProps["onSelect"]>>[0]) {
    let path = item.key;
    if (path) navigate(path);
  }
  return (
    <ProLayout
      logo={<IjiaLogo />}
      title="IJIA 学院"
      route={menus}
      location={{
        pathname: pathname,
      }}
      avatarProps={{
        src: "https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg",
        size: "small",
        title: "Name",
        render: (props, dom) => {
          return avatarDropdownRender(dom, navigate);
        },
      }}
      layout="mix"
      splitMenus
      menuProps={{
        onSelect: onMenuSelect,
      }}
    >
      {props.children}
    </ProLayout>
  );
}

import { PropsWithChildren } from "react";
import { ProLayout } from "@ant-design/pro-components";
import { IjiaLogo } from "../site-logo.tsx";
import { MenuProps } from "antd";
import { useLocation, useNavigate } from "react-router";
import { menus } from "./menus.ts";
import { avatarDropdownRender } from "./avatar.tsx";
import { useCurrentUser } from "@/common/user.ts";

export function TabHeader(props: PropsWithChildren<{}>) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  function onMenuSelect(item: Parameters<NonNullable<MenuProps["onSelect"]>>[0]) {
    let path = item.key;
    if (path) navigate(path);
  }
  const user = useCurrentUser();
  return (
    <ProLayout
      logo={<IjiaLogo />}
      title="IJIA 学院"
      route={menus}
      location={{
        pathname: pathname,
      }}
      avatarProps={{
        src: user.value?.avatar_url,
        size: "small",
        title: user.value?.nickname,
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

import { PropsWithChildren } from "react";
import { ProLayout, ProLayoutProps } from "@ant-design/pro-components";
import { IjiaLogo } from "../../common/site-logo.tsx";
import { Button, MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import { menus } from "./menus.ts";
import { gotoHome } from "@/common/navigation.ts";
import { getUserToken, useCurrentUser } from "@/common/user.ts";
import { avatarDropdownRender } from "./avatar.tsx";
import { useAntdStatic } from "@/hooks/antd.ts";

function LayoutBase(
  props: PropsWithChildren<{ avatarProps?: ProLayoutProps["avatarProps"]; action?: React.ReactNode }>,
) {
  const { children = <Outlet />, action } = props;
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
    </ProLayout>
  );
}
const IS_DEV = import.meta.env.DEV;
export function UserLayout(props: PropsWithChildren<{}>) {
  const navigate = useNavigate();
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
                return avatarDropdownRender(dom, { navigate, onLogout: logout });
              },
              children: user.nickname ?? " ",
            }
          : undefined
      }
      action={IS_DEV && user ? <Button onClick={copyToken}>复制token</Button> : undefined}
    >
      {props.children}
    </LayoutBase>
  );
}

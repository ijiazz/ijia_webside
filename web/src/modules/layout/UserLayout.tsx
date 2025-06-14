import React, { PropsWithChildren } from "react";
import { IjiaLogo } from "../../common/site-logo.tsx";
import { Button, Tooltip } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import { menus } from "./menus.tsx";
import { getUserToken, useCurrentUser } from "@/common/user.ts";
import { AvatarMenu } from "./avatar.tsx";
import { AntdThemeProvider, useAntdStatic, useThemeController } from "@/global-provider.tsx";
import styled from "@emotion/styled";
import { RootLayout } from "./RootLayout.tsx";
import { DayNightSwitch } from "@/lib/components/switch/DayNightSwitch.tsx";

const IS_DEV = import.meta.env?.DEV;

export function UserLayout(props: PropsWithChildren<{}>) {
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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, value: user } = useCurrentUser();
  const themeCtrl = useThemeController();
  return (
    <RootLayout
      leftExtra={
        <StyledIcon>
          <IjiaLogo className="site-logo" />
          <b className="site-name">IJIA 学院</b>
        </StyledIcon>
      }
      menus={menus}
      pathname={pathname}
      onSelectedKeysChange={({ keys, path }) => {
        if (path) navigate(path);
      }}
      rightExtra={
        <div style={{ display: "flex", gap: 8, marginRight: 8, alignItems: "center" }}>
          {IS_DEV && user ? <Button onClick={copyToken}>复制token</Button> : undefined}
          <Tooltip title={themeCtrl.mode === "dark" ? "切换到亮色主题" : "切换到暗色主题"}>
            <DayNightSwitch
              checked={themeCtrl.mode === "dark"}
              style={{ zoom: 0.7 }}
              onChange={(checked) => {
                console.log("切换主题", checked);
                themeCtrl.setMode(checked ? "dark" : "light");
              }}
            />
          </Tooltip>
          <AvatarMenu
            noLogged={!user}
            userName={!user ? "登录" : user?.nickname}
            userUrl={user?.avatar_url}
            logout={logout}
          />
        </div>
      }
    >
      <Outlet />
    </RootLayout>
  );
}

export function UserThemeLayout() {
  return (
    <AntdThemeProvider>
      <UserLayout />
    </AntdThemeProvider>
  );
}
const StyledIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .site-name {
    font-weight: 600;
    font-size: 16px;
  }
  .site-logo {
    margin-left: 16px;
  }

  @media (max-width: 600px) {
    .site-name {
      display: none;
    }
  }
  @media (max-width: 400px) {
    display: none;
  }
`;

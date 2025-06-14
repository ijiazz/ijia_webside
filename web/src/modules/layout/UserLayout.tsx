import React, { PropsWithChildren } from "react";
import { IjiaLogo } from "../../common/site-logo.tsx";
import { Button, Space } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import { menus } from "./menus.tsx";
import { getUserToken, useCurrentUser } from "@/common/user.ts";
import { AvatarMenu } from "./avatar.tsx";
import { useAntdStatic } from "@/global-provider.tsx";
import styled from "@emotion/styled";
import { RootLayout } from "./RootLayout.tsx";

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
        <Space style={{ marginRight: 12 }}>
          {IS_DEV && user ? <Button onClick={copyToken}>复制token</Button> : undefined}
          <AvatarMenu
            noLogged={!user}
            userName={!user ? "登录" : user?.nickname}
            userUrl={user?.avatar_url}
            logout={logout}
          />
        </Space>
      }
    >
      <Outlet />
    </RootLayout>
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

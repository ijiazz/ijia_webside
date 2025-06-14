import React from "react";
import { Avatar, Button, Dropdown } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router";
import styled from "@emotion/styled";
import { VLink } from "@/lib/components/VLink.tsx";
import { IS_MOBILE_LAYOUT, useThemeToken } from "@/global-provider.tsx";

export function AvatarMenu(props: { noLogged?: boolean; logout?: () => void; userUrl?: string; userName?: string }) {
  const { logout, userName, userUrl, noLogged } = props;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useThemeToken();
  if (noLogged)
    return (
      <VLink to={noLogged ? "/passport/login?redirect=" + pathname : undefined}>
        <Button type="text" style={{ color: theme.colorTextSecondary }}>
          {userName}
        </Button>
      </VLink>
    );
  return (
    <Dropdown
      open={noLogged ? false : undefined}
      trigger={["click", "hover"]}
      menu={{
        items: [
          {
            key: "profile",
            icon: <UserOutlined />,
            label: "个人中心",
            onClick: () => navigate("/profile/center"),
          },
          {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "退出登录",
            onClick: logout,
          },
        ],
      }}
    >
      <MenuAvatar hoverColor={theme.colorBgTextHover}>
        <Avatar className="e2e-avatar" size={28} src={userUrl}>
          {userName}
        </Avatar>
        <span style={{ color: theme.colorTextSecondary }}>{userName}</span>
      </MenuAvatar>
    </Dropdown>
  );
}

const MenuAvatar = styled.div<{ hoverColor: string }>`
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  :hover {
    background-color: ${(props) => props.hoverColor};
  }
  > span:last-of-type {
    @media screen and (${IS_MOBILE_LAYOUT}) {
      display: none;
    }
  }
`;

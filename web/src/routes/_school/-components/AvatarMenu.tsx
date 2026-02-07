import { Avatar, Button, Dropdown } from "antd";
import { LoadingOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "@tanstack/react-router";
import styled from "@emotion/styled";
import { VLink } from "@/lib/components/VLink.tsx";
import { IS_MOBILE_LAYOUT, useThemeToken } from "@/provider/mod.tsx";
import { UserBasicDto } from "@/api.ts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/common/http.ts";
import { clearUserCache } from "@/common/user.ts";
import { ROUTES } from "@/app.ts";
import { useMemo } from "react";

export function AvatarMenu(props: { user: UserBasicDto | null }) {
  const { user } = props;
  const { mutate, isPending: isLogoutLoading } = useMutation({
    mutationFn: () => api["/passport/logout"].post(),
    onSuccess: () => {
      clearUserCache();
      navigate({ to: ROUTES.Login });
    },
  });
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useThemeToken();

  const nav = useMemo(() => {
    const url = new URL(ROUTES.Login, window.location.origin);
    url.searchParams.set("redirect", pathname);

    return url.pathname + url.search;
  }, [pathname]);

  if (!user)
    return (
      <VLink to={nav}>
        <Button type="text" style={{ color: theme.colorTextSecondary }}>
          登录
        </Button>
      </VLink>
    );
  return (
    <Dropdown
      trigger={["hover"]}
      menu={{
        items: [
          {
            key: "profile",
            icon: <UserOutlined />,
            label: "个人中心",
            onClick: () => navigate({ to: "/profile/center", viewTransition: true }),
          },
          {
            key: "logout",
            icon: isLogoutLoading ? <LoadingOutlined /> : <LogoutOutlined />,
            label: "退出登录",
            onClick: () => mutate(),
          },
        ],
      }}
    >
      <MenuAvatar hoverColor={theme.colorBgTextHover}>
        <Avatar className="e2e-avatar" size={32} src={user.avatar_url}>
          {user.nickname}
        </Avatar>
        <span style={{ color: theme.colorTextSecondary }}>{user.nickname}</span>
      </MenuAvatar>
    </Dropdown>
  );
}

const MenuAvatar = styled.div<{ hoverColor: string }>`
  padding: 4px;
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

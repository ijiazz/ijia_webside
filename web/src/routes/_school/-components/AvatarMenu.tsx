import { Avatar, Button, Dropdown } from "antd";
import { LoadingOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { css, cx } from "@emotion/css";
import { VLink } from "@/lib/components/VLink.tsx";
import { IS_MOBILE_LAYOUT, useThemeToken } from "@/provider/mod.tsx";
import { UserBasicDto } from "@/api.ts";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/request/client.ts";
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
      <div
        className={cx(
          MenuAvatar,
          css`
            :hover {
              background-color: ${theme.colorBgTextHover};
            }
          `,
        )}
      >
        <Avatar className="e2e-avatar" size={32} src={user.avatar_url}>
          {user.nickname}
        </Avatar>
        <span style={{ color: theme.colorTextSecondary }}>{user.nickname}</span>
      </div>
    </Dropdown>
  );
}

const MenuAvatar = css`
  padding: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  > span:last-of-type {
    @media screen and (${IS_MOBILE_LAYOUT}) {
      display: none;
    }
  }
`;

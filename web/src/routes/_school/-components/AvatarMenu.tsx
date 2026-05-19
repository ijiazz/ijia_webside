import { Avatar, Button, Dropdown } from "antd";
import { LogoutOutlined, UserOutlined, HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "@tanstack/react-router";
import { css, cx } from "@emotion/css";
import { VLink } from "@/lib/components/VLink.tsx";
import { IS_MOBILE_LAYOUT, useThemeToken } from "@/provider/mod.tsx";
import { User } from "@/api.ts";
import { getLoginURL, getLogoutURL } from "@/common/host.ts";

export function AvatarMenu(props: { user: User | null }) {
  const { user } = props;

  const navigate = useNavigate();
  const theme = useThemeToken();

  if (!user)
    return (
      <VLink to={getLoginURL(globalThis.location.origin)}>
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
            key: "user-home",
            icon: <HomeOutlined />,
            label: "个人主页",
            onClick: () => {
              navigate({
                to: "/user/$userId",
                params: { userId: user.user_id.toString() },
                viewTransition: true,
              });
            },
          },
          {
            key: "profile",
            icon: <UserOutlined />,
            label: "个人中心",
            onClick: () => navigate({ to: "/profile/center", viewTransition: true }),
          },
          {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "退出登录",
            onClick: () => navigate({ href: getLogoutURL(globalThis.location.origin), viewTransition: true }),
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

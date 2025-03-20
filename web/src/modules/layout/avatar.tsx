import { ReactNode } from "react";
import { Dropdown } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";

export function avatarDropdownRender(dom: ReactNode, option: { onLogout(): void; navigate: (to: string) => void }) {
  return (
    <Dropdown
      menu={{
        items: [
          {
            key: "profile",
            icon: <UserOutlined />,
            label: "个人中心",
            onClick: () => option.navigate("/profile/center"),
          },
          {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "退出登录",
            onClick: option.onLogout,
          },
        ],
      }}
    >
      {dom}
    </Dropdown>
  );
}

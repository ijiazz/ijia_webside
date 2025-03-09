import { ReactNode } from "react";
import { Dropdown } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { logout } from "@/modules/passport/util/auth.ts";

export function avatarDropdownRender(dom: ReactNode, navigate: (to: string) => void) {
  return (
    <Dropdown
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
      {dom}
    </Dropdown>
  );
}

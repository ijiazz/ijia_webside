import { UserOutlined, SecurityScanOutlined } from "@ant-design/icons";
import { MenuItem } from "./RootLayout.tsx";
import { SECURITY_SETTING_URL } from "@/common/host.ts";

// 二菜单需要考虑图标，否则菜单收起后不是很好看

export const menus: MenuItem<{ href?: string }>[] = [
  {
    key: "wall",
    label: "表白墙",
  },
  {
    key: "live",
    label: "动态",
  },
  {
    key: "examination",
    label: "考试",
    children: [
      {
        key: "simulate",
        label: "模拟考试",
      },
      {
        key: "final_exam",
        label: "期末考试",
      },
    ],
  },
  {
    key: "profile",
    children: [
      {
        key: "center",
        label: "个人中心",
        icon: <UserOutlined />,
      },
      {
        key: "security",
        label: "安全设置",
        icon: <SecurityScanOutlined />,
        href: SECURITY_SETTING_URL,
      },
    ],
  },
];

import { ProLayoutProps } from "@ant-design/pro-components";
import { UserOutlined, SecurityScanOutlined } from "@ant-design/icons";
import React from "react";
import { MenuItem } from "./RootLayout.tsx";

export type MenuRoute = NonNullable<ProLayoutProps["route"]>;

// 二菜单需要考虑图标，否则菜单收起后不是很好看

export const menus: MenuItem[] = [
  {
    path: "wall",
    label: "表白墙",
  },
  {
    path: "live",
    label: "动态",
  },
  {
    path: "examination",
    label: "考试",
    children: [
      {
        path: "simulate",
        label: "模拟考试",
      },
      {
        path: "final_exam",
        label: "期末考试",
      },
    ],
  },
  {
    path: "profile",
    children: [
      {
        path: "center",
        label: "个人中心",
        icon: <UserOutlined />,
      },
      {
        path: "security",
        label: "安全设置",
        icon: <SecurityScanOutlined />,
      },
    ],
  },
];

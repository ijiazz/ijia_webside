import { ProLayoutProps } from "@ant-design/pro-components";
import { MenuDataItem } from "@ant-design/pro-components";
import { UserOutlined, SecurityScanOutlined } from "@ant-design/icons";
import React from "react";

export type MenuRoute = NonNullable<ProLayoutProps["route"]>;

// 二菜单需要考虑图标，否则菜单收起后不是很好看

export const menus: MenuDataItem = {
  children: [
    {
      path: "wall",
      name: "表白墙",
    },
    {
      path: "live",
      name: "动态",
    },
    {
      path: "examination",
      name: "考试",
      children: [
        {
          path: "simulate",
          name: "模拟考试",
        },
        {
          path: "final_exam",
          name: "期末考试",
        },
      ],
    },
    {
      path: "profile",
      children: [
        {
          path: "center",
          name: "个人中心",
          icon: <UserOutlined />,
        },
        {
          path: "security",
          name: "安全设置",
          icon: <SecurityScanOutlined />,
        },
      ],
    },
  ],
};

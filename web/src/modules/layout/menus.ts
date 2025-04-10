import { ProLayoutProps } from "@ant-design/pro-components";
import { MenuDataItem } from "@ant-design/pro-components";

export type MenuRoute = NonNullable<ProLayoutProps["route"]>;
export const menus: MenuDataItem = {
  children: [
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
        },
        {
          path: "security",
          name: "安全设置",
        },
      ],
    },
  ],
};

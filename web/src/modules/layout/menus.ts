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
          path: "cc",
          name: "abc",
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

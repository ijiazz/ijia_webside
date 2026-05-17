import React, { ReactNode, useMemo } from "react";
import { Tabs, TabsProps } from "antd";
import { AdaptiveMenuLayout } from "./AdaptiveMenuLayout.tsx";
import { ItemType, MenuItemType } from "antd/es/menu/interface.js";
import { useThemeToken } from "@/provider/AntdProvider.tsx";
import * as styles from "./RootLayout.css.ts";

type TabPane = NonNullable<TabsProps["items"]>[number];
type MenuItemCommon = {
  icon?: React.ReactNode;
  /**菜单的名字 */
  label?: ReactNode;
  /**disable 菜单选项 */
  disabled?: boolean;
  /**指定外链打开形式，同a标签 */
  target?: string;
};
export type MenuItem<T = unknown> = MenuItemCommon & {
  key: string;
  /**子菜单 */
  children?: MenuItem<T>[];
  /**菜单的icon */
  hidden?: boolean;
} & ({} extends T ? T : {});

type ChangeEvent<T> = {
  keys: string[];
  menuPath: MenuItem<T>[];
  target: MenuItem<T>;
};
export type RootLayoutProps<T> = {
  menus?: MenuItem<T>[];

  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelectedKeysChange?: (e: ChangeEvent<T>) => void;

  /** 顶部 tab render */
  renderLink: (item: MenuItem<T>) => ReactNode;

  leftExtra?: ReactNode;
  rightExtra?: ReactNode;

  children?: ReactNode;
};

export function RootLayout<T>(props: RootLayoutProps<T>) {
  const { children, onSelectedKeysChange, renderLink, leftExtra, rightExtra, selectedKeys } = props;
  const { map, tabItems, submenus } = useMemo(() => {
    const menus = props.menus ?? [];

    const map: MenuTree<T> = createMenuTree(menus);
    const submenus: Record<string, ItemType<MenuItemType>[]> = {};
    const tabItems: TabPane[] = new Array(menus.length);

    for (let i = 0; i < menus.length; i++) {
      const item = menus[i];
      const key = item.key;
      const children = item.children;
      if (children) submenus[key] = menuItemToAntd(children);
      tabItems[i] = {
        key: key,
        label: renderLink(item),
        icon: item.icon,
      };
    }

    return { map, tabItems, submenus };
  }, [props.menus]);
  const selectedKey = useMemo(() => {
    return {
      root: selectedKeys?.[0],
      sub: selectedKeys?.slice(1),
    };
  }, [selectedKeys]);

  const defaultSelectedKey = useMemo(() => {
    const defaultActiveKey = props.defaultSelectedKeys;
    return {
      root: defaultActiveKey?.[0],
      sub: defaultActiveKey?.slice(1),
    };
  }, [props.defaultSelectedKeys]);

  const submenu = selectedKey.root ? submenus[selectedKey.root] : undefined;
  const theme = useThemeToken();
  return (
    <div
      className={styles.Root}
      style={{ background: `linear-gradient(${theme.colorBgContainer}, ${theme.colorBgLayout} 28%)` }}
    >
      <Tabs
        indicator={{}}
        tabBarExtraContent={{
          left: leftExtra,
          right: rightExtra,
        }}
        className={styles.NavTab}
        style={{ "--border-color": theme.colorBorderSecondary }}
        animated
        defaultActiveKey={defaultSelectedKey.root}
        activeKey={selectedKey.root}
        onChange={(key) => {
          if (!map[key]) return;
          const menu = map[key].internal;
          onSelectedKeysChange?.({ keys: [key], target: menu, menuPath: [menu] });
        }}
        items={tabItems}
      />
      <AdaptiveMenuLayout
        className="root-layout-body"
        items={submenu}
        defaultSelectedKeys={defaultSelectedKey.sub}
        selectedKeys={selectedKey.sub}
        onSelect={(e) => {
          if (onSelectedKeysChange) {
            const keys = [selectedKey.root!, ...e.selectedKeys];
            const menu = getMenuByPath(keys, map);
            const lastMenu = menu[menu.length - 1];
            onSelectedKeysChange?.({ keys, target: lastMenu, menuPath: menu });
          }
        }}
        styles={{
          menu: { display: submenu?.length ? undefined : "none" },
        }}
      >
        {children}
      </AdaptiveMenuLayout>
    </div>
  );
}

function getMenuByPath<T>(path: string[], menuTree: MenuTree<T>): MenuItem<T>[] {
  let curr: MenuTree<T> | undefined = menuTree;
  const res: MenuItem<T>[] = [];
  let i = 0;
  for (; i < path.length && curr; i++) {
    const node: MenuTreeNode<T> | undefined = curr[path[i]];
    if (!node) break;
    res.push(node.internal);
    curr = node.subMap;
  }
  return res;
}

type MenuTree<T> = Record<string, MenuTreeNode<T> | undefined>;

type MenuTreeNode<T> = {
  internal: MenuItem<T>;
  subMap?: MenuTree<T>;
};

function createMenuTree<T>(items: MenuItem<T>[]): MenuTree<T> {
  const tree: MenuTree<T> = {};

  for (const item of items) {
    tree[item.key] = {
      internal: item,
      subMap: item.children ? createMenuTree(item.children) : undefined,
    };
  }
  return tree;
}
function menuItemToAntd<T>(items: MenuItem<T>[]): ItemType<MenuItemType>[] {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    disabled: item.disabled,
    children: item.children ? menuItemToAntd(items) : undefined,
  }));
}

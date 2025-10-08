import React, { ReactNode, useMemo } from "react";
import styled from "@emotion/styled";
import { Tabs, TabsProps } from "antd";
import { AdaptiveMenuLayout } from "./AdaptiveMenuLayout.tsx";
import { ItemType, MenuItemType } from "antd/es/menu/interface.js";
import { useThemeToken } from "@/provider/AntdProvider.tsx";
import { IS_MOBILE_LAYOUT } from "@/provider/LayoutDirectionProvider.tsx";

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
export type MenuItem = MenuItemCommon &
  (
    | {
        /**用于标定选中的值，默认是 path */
        key: string;
        path?: string;
      }
    | {
        key?: undefined;
        /**路径,可以设定为网页链接 */
        path: string;
      }
  ) & {
    /**子菜单 */
    children?: MenuItem[];
    /**菜单的icon */
    hidden?: boolean;
  };
type ChangeEvent = {
  keys: string[];
  path: string;
};
export type RootLayoutProps<T extends MenuItem = MenuItem> = {
  menus?: T[];
  /** 根据路经解析 selectedKeys */
  pathname?: string;
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelectedKeysChange?: (e: ChangeEvent) => void;

  renderLink: (item: T) => ReactNode;

  leftExtra?: ReactNode;
  rightExtra?: ReactNode;

  children?: ReactNode;
};

export function RootLayout(props: RootLayoutProps) {
  const { children, onSelectedKeysChange, renderLink, leftExtra, rightExtra } = props;
  const { map, tabItems, menus, submenus } = useMemo(() => {
    const menus = props.menus;
    const internalMenus = menuItemsToInternalItem(menus || []);

    const map: MenuTree = createMenuTree(internalMenus);
    const submenus: Record<string, ItemType<MenuItemType>[]> = {};
    const tabItems: TabPane[] = new Array(internalMenus.length);

    for (let i = 0; i < internalMenus.length; i++) {
      const item = internalMenus[i];
      const key = item.key;
      const children = item.children;
      if (children) submenus[key] = menuItemToAntd(children);
      tabItems[i] = {
        key: key,
        label: renderLink(item),
        icon: item.icon,
      };
    }

    return { map, tabItems, menus: internalMenus, submenus };
  }, [props.menus]);
  const inputSelectedKeys = useMemo(() => {
    return props.selectedKeys || (props.pathname ? pathToKeys(menus, props.pathname, 0, []) : undefined);
  }, [props.selectedKeys, props.pathname]);
  const selectedKey = useMemo(() => {
    return {
      root: inputSelectedKeys?.[0],
      sub: inputSelectedKeys?.slice(1),
    };
  }, [inputSelectedKeys]);

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
    <RootLayoutCSS style={{ background: `linear-gradient(${theme.colorBgContainer}, ${theme.colorBgLayout} 28%)` }}>
      <StyledNavTab className="root-layout-nav" borderColor={theme.colorBorderSecondary}>
        <Tabs
          indicator={{}}
          tabBarExtraContent={{
            left: leftExtra,
            right: rightExtra,
          }}
          animated
          defaultActiveKey={defaultSelectedKey.root}
          activeKey={selectedKey.root}
          onChange={(key) => {
            onSelectedKeysChange?.({ keys: [key], path: map[key]?.internal.path || "" });
          }}
          items={tabItems}
        />
      </StyledNavTab>
      <AdaptiveMenuLayout
        className="root-layout-body"
        items={submenu}
        defaultSelectedKeys={defaultSelectedKey.sub}
        selectedKeys={selectedKey.sub}
        onSelect={(e) => {
          if (onSelectedKeysChange) {
            const keys = [selectedKey.root!, ...e.selectedKeys];
            onSelectedKeysChange?.({ keys, path: getPath(keys, map).join("/") });
          }
        }}
        styles={{
          menu: { display: submenu?.length ? undefined : "none" },
        }}
      >
        {children}
      </AdaptiveMenuLayout>
    </RootLayoutCSS>
  );
}

/**
 * 可继续优化算法效率
 */
function pathToKeys(menus: InternalMenuItem[] | undefined, path: string, pathIndex: number, match: string[]): string[] {
  if (!menus || menus.length === 0) return match;
  if (path[0] === "/") pathIndex++;
  for (let i = 0; i < menus.length; i++) {
    const curr = menus[i].path;

    if (!curr) continue;
    if (curr === path.substring(pathIndex, pathIndex + curr.length)) {
      match.push(menus[i].key);
      return pathToKeys(menus[i].children, path, pathIndex + curr.length, match);
    }
  }
  return match;
}
function getPath(keys: string[], menuTree: MenuTree): string[] {
  const path: string[] = new Array<string>(keys.length);

  let node = menuTree[keys[0]];
  if (node) path[0] = node.internal.key;
  for (let i = 1; node && i < keys.length; i++) {
    node = node.subMap?.[keys[i]];
    if (node) path[i] = node.internal.key;
  }
  return path;
}
type InternalMenuItem = MenuItemCommon & {
  key: string;
  path?: string;
  /**子菜单 */
  children?: InternalMenuItem[];
};
type MenuTree = Record<string, MenuTreeNode | undefined>;

type MenuTreeNode = {
  internal: InternalMenuItem;
  subMap?: MenuTree;
};
function menuItemsToInternalItem(items: MenuItem[]): InternalMenuItem[] {
  return items
    .filter((item) => !item.hidden)
    .map((item, i) => {
      return {
        ...item,
        key: item.key || item.path || i.toString(),
        children: item.children ? menuItemsToInternalItem(item.children) : undefined,
      };
    });
}
function createMenuTree(items: InternalMenuItem[]): MenuTree {
  const tree: MenuTree = {};

  for (const item of items) {
    tree[item.key] = {
      internal: item,
      subMap: item.children ? createMenuTree(item.children) : undefined,
    };
  }
  return tree;
}
function menuItemToAntd(items: InternalMenuItem[]): ItemType<MenuItemType>[] {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    disabled: item.disabled,
    children: item.children ? menuItemToAntd(items) : undefined,
  }));
}

const StyledNavTab = styled.div<{ borderColor: string }>`
  --border-color: ${(props) => props.borderColor};
  > .ant-tabs {
    backdrop-filter: blur(8px);
    border-block-end: 1px solid var(--border-color);

    .ant-tabs-nav {
      margin: 0;

      .ant-tabs-nav-wrap {
        .ant-tabs-tab {
          margin: 0 16px;
          padding: 16px 0;
        }
        /* .ant-tabs-tab {
          border-radius: 3px;
          margin: 0;
          padding: 16px;
          :hover {
            background: rgba(0, 0, 0, 0.03);
            color: inherit;
          }
        } */
        .ant-tabs-tab.ant-tabs-tab-active {
        }
        .ant-tabs-ink-bar.ant-tabs-ink-bar-animated {
        }

        margin-left: 12px;
        .ant-tabs-tab:first-of-type {
          margin-left: 4px;
        }
      }
    }
  }
`;

const RootLayoutCSS = styled.div`
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  > .root-layout-body {
    flex: 1;
    overflow: auto;
  }

  @media screen and (${IS_MOBILE_LAYOUT}) {
    flex-direction: column-reverse;

    > .root-layout-nav {
      .ant-tabs {
        border-block-end: 0 !important;
        border-block-start: 1px solid var(--border-color);

        .ant-tabs-tab {
          padding: 14 px 0 !important;
        }
      }
    }
  }
`;

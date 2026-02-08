import React, { ReactNode } from "react";
import { css, cx } from "@emotion/css";
import { IS_MOBILE_LAYOUT, LayoutDirection, useLayoutDirection, useThemeToken } from "@/provider/mod.tsx";
import { Menu } from "antd";
type AntdMenuProps = Omit<Parameters<typeof Menu>[0], "children">;
export type AdaptiveMenuLayoutProps = Pick<
  AntdMenuProps,
  "items" | "defaultSelectedKeys" | "onClick" | "onSelect" | "selectedKeys"
> & {
  leftExtra?: ReactNode;
  rightExtra?: ReactNode;
  children?: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  styles?: {
    menu?: React.CSSProperties;
    content?: React.CSSProperties;
  };
};

export function AdaptiveMenuLayout(props: AdaptiveMenuLayoutProps) {
  const { className, style, children, leftExtra, rightExtra, styles, ...menuProps } = props;
  const isVertical = useLayoutDirection() === LayoutDirection.Vertical;

  const theme = useThemeToken();
  return (
    <div className={cx(AdaptiveMenuLayoutCSS, className)} style={style}>
      <div
        className={cx(NavigationTabCSS, "adaptive-menu")}
        style={{ borderColor: theme.colorBorderSecondary, ...styles?.menu }}
      >
        <div className="adaptive-menu-left">{leftExtra}</div>

        <Menu {...menuProps} mode={isVertical ? "horizontal" : "vertical"} className="adaptive-menu-center" />
        <div className="adaptive-menu-right"> {rightExtra}</div>
      </div>
      <div className="adaptive-content" style={styles?.content}>
        {children}
      </div>
    </div>
  );
}
const NavigationTabCSS = css`
  overflow: auto;
  display: flex;
  border: 0px solid;
  border-right-width: 1px;

  flex-direction: column;
  > .adaptive-menu-center {
    flex: 1;
  }

  > .ant-menu {
    border: none;
    background-color: transparent;
  }
  > .ant-menu-horizontal {
    margin-bottom: 1px;
  }

  @media screen and (${IS_MOBILE_LAYOUT}) {
    align-items: center;
    height: auto;
    flex-direction: row;

    > .ant-menu-horizontal {
      line-height: 3;
    }

    border-bottom-width: 1px;
    border-right-width: 0px;
  }
`;

const AdaptiveMenuLayoutCSS = css`
  display: flex;
  overflow: auto;
  > .adaptive-content {
    flex: 1;
    overflow: auto;
  }

  @media screen and (${IS_MOBILE_LAYOUT}) {
    flex-direction: column;
    > * {
      height: auto;
    }
  }
`;

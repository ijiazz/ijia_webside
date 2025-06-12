import React, { ReactNode } from "react";
import styled from "@emotion/styled";
import { IS_MOBILE_LAYOUT, useLayoutDirection, LayoutDirection } from "@/global-provider.tsx";

export type AdaptiveMenuLayoutProps = {
  menu?: ReactNode | ((direction: LayoutDirection) => ReactNode);
  children?: ReactNode | ((direction: LayoutDirection) => ReactNode);
  style?: React.CSSProperties;
  className?: string;
};

export function AdaptiveMenuLayout(props: AdaptiveMenuLayoutProps) {
  const { className, style } = props;
  let { menu, children } = props;

  const direction = useLayoutDirection();
  if (typeof menu === "function") menu = menu(direction);
  if (typeof children === "function") children = children(direction);
  return (
    <AdaptiveMenuLayoutCSS className={className} style={style}>
      <div className="adaptive-menu">{menu}</div>
      <div className="adaptive-content">{children}</div>
    </AdaptiveMenuLayoutCSS>
  );
}

const AdaptiveMenuLayoutCSS = styled.div`
  display: flex;
  .adaptive-menu {
    height: 100%;
    overflow: auto;
  }
  .adaptive-content {
    flex: 1;
    overflow: auto;
    height: 100%;
  }
  .ant-menu-root.ant-menu-horizontal {
    margin-bottom: 1px;
  }

  @media screen and (${IS_MOBILE_LAYOUT}) {
    flex-direction: column;
    .adaptive-menu {
      height: auto;
    }
    .ant-menu-root.ant-menu-horizontal {
      line-height: 3;
    }
    /* 应用的样式 */
  }
`;

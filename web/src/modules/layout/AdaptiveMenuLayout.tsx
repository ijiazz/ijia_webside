import React, { ReactNode, useEffect, useState } from "react";
import styled from "@emotion/styled";

export type AdaptiveMenuLayoutProps = {
  menu?: ReactNode | ((direction: LayoutDirection) => ReactNode);
  children?: ReactNode | ((direction: LayoutDirection) => ReactNode);
  style?: React.CSSProperties;
  className?: string;
};
export const IS_MOBILE_LAYOUT = "(max-width: 550px) and (orientation: portrait)";
function getDefaultDirection() {
  return globalThis.matchMedia?.(IS_MOBILE_LAYOUT).matches ? LayoutDirection.Vertical : LayoutDirection.Horizontal;
}
export function AdaptiveMenuLayout(props: AdaptiveMenuLayoutProps) {
  const { className, style } = props;
  let { menu, children } = props;

  const [direction, setDirection] = useState(getDefaultDirection);
  useEffect(() => {
    const mql = window.matchMedia(IS_MOBILE_LAYOUT);
    const direction = mql.matches ? LayoutDirection.Vertical : LayoutDirection.Horizontal;
    if (mql.matches) setDirection(direction);
    const onChange = (e: MediaQueryListEvent) => {
      setDirection(e.matches ? LayoutDirection.Vertical : LayoutDirection.Horizontal);
    };
    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, []);
  if (typeof menu === "function") menu = menu(direction);
  if (typeof children === "function") children = children(direction);
  return (
    <AdaptiveLayoutContext value={direction}>
      <AdaptiveMenuLayoutCSS className={className} style={style}>
        <div className="adaptive-menu">{menu}</div>
        <div className="adaptive-content">{children}</div>
      </AdaptiveMenuLayoutCSS>
    </AdaptiveLayoutContext>
  );
}
export enum LayoutDirection {
  Horizontal = 0,
  Vertical = 1,
}
export const AdaptiveLayoutContext = React.createContext<LayoutDirection>(LayoutDirection.Horizontal);

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

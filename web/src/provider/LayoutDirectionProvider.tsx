import React, { ReactNode, useEffect, useState } from "react";

export type AdaptiveMenuLayoutProps = {
  menu?: ReactNode | ((direction: LayoutDirection) => ReactNode);
  children?: ReactNode | ((direction: LayoutDirection) => ReactNode);
  style?: React.CSSProperties;
  className?: string;
};
export const IS_MOBILE_LAYOUT = "(max-width: 550px) and (orientation: portrait)";
function getDirection() {
  return globalThis.matchMedia?.(IS_MOBILE_LAYOUT).matches ? LayoutDirection.Vertical : LayoutDirection.Horizontal;
}
function useDirection() {
  const [direction, setDirection] = useState(getDirection);
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
  return direction;
}
export function LayoutDirectionProvider(props: { children?: ReactNode }) {
  const direction = useDirection();
  return <AdaptiveLayoutContext value={direction}>{props.children}</AdaptiveLayoutContext>;
}

export enum LayoutDirection {
  Horizontal = 0,
  Vertical = 1,
}
const AdaptiveLayoutContext = React.createContext<LayoutDirection>(LayoutDirection.Horizontal);
export function useLayoutDirection() {
  return React.useContext(AdaptiveLayoutContext);
}

import React, { CSSProperties, PropsWithChildren } from "react";

export function PagePadding(props: PropsWithChildren<{ style?: CSSProperties }>) {
  return <div style={{ padding: 24, ...props.style }}>{props.children}</div>;
}

import React, { PropsWithChildren } from "react";

export function PagePadding(props: PropsWithChildren<{}>) {
  return <div style={{ padding: 24, height: "100%" }}>{props.children}</div>;
}

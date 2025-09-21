import React from "react";

import { Link, LinkProps } from "@tanstack/react-router";

export type VLinkProps = Pick<LinkProps, "target"> & { to?: string; children?: React.ReactNode };
export function VLink(
  props: VLinkProps & React.RefAttributes<HTMLAnchorElement> & React.StyleHTMLAttributes<HTMLAnchorElement>,
) {
  if (!props.to) return props.children;
  return React.createElement(Link, props as LinkProps);
}

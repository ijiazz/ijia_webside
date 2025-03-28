import React from "react";
import { Link, To, LinkProps } from "react-router";

export type VLinkProps = Omit<LinkProps, "to" | "ref"> & { to?: To };
export function VLink(props: VLinkProps & React.RefAttributes<HTMLAnchorElement>) {
  if (!props.to) return props.children;
  return React.createElement(Link, props as LinkProps);
}

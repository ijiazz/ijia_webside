import styled from "@emotion/styled";
import React, { CSSProperties } from "react";
import { ReactNode } from "react";

export type CardLayoutProps = {
  header?: ReactNode;
  icon?: ReactNode;
  extra?: ReactNode;
  footer?: ReactNode;

  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};
export function CardLayout(props: CardLayoutProps) {
  const { children, extra, header, footer, icon, style, className } = props;
  return (
    <CardLayoutCSS className={className} style={style}>
      <div className="card-layout-header">
        <div className="card-layout-icon">{icon}</div>
        <div className="card-layout-header-info">{header}</div>
        <div className="card-layout-extra">{extra}</div>
      </div>
      <div className="card-layout-content">{children}</div>
      <div className="card-layout-footer">{footer}</div>
    </CardLayoutCSS>
  );
}
const CardLayoutCSS = styled.div`
  padding: 6px 0px;
  .card-layout {
    &-header {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: center;
      margin: 4px 12px;
    }
    &-header-info {
      flex: 1;
    }
    &-content {
      margin: 4px 12px;
    }
    &-footer {
      margin: 4px 12px;
    }
  }
`;

import React from "react";
import { css, cx } from "@emotion/css";
import { CardLayoutProps } from "@/lib/components/card/card.tsx";
import { PostHeader, PostHeaderProps } from "../../-components/post.tsx";
import { useThemeToken } from "@/provider/mod.tsx";
export type { CardLayoutProps };

export function PinkPostCard(props: Omit<CardLayoutProps, "header"> & { header: PostHeaderProps }) {
  const { children, extra, header, footer, icon, style, className } = props;
  const token = useThemeToken();
  return (
    <div className={cx(CardLayoutCSS, className)} style={{ background: token.colorBgContainer, ...style }}>
      <div className="card-layout-header">
        <div className="card-layout-icon">{icon}</div>
        <PostHeader {...header} style={{ flex: 1 }} />
        <div className="card-layout-extra">{extra}</div>
      </div>
      <div className="card-layout-content">{children}</div>
      <div className="card-layout-footer">{footer}</div>
    </div>
  );
}

const CardLayoutCSS = css`
  .card-layout {
    &-header {
      padding: 6px 0px;
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
      margin: 4px 18px;
    }
    &-footer {
      overflow: hidden;
      padding: 4px 0;
    }
  }
  .post-header-owner-name {
    flex-grow: 1;
    font-weight: 600;
  }

  .subtitle {
    font-size: 0.6em;
    font-weight: 300;
  }

  border-radius: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  padding-bottom: 0;

  ::before {
    content: "";
    width: 140px;
    height: 140px;
    position: absolute;
    top: 20%;
    right: 5%;
    border-radius: 50%;
    border: 35px solid rgba(255, 255, 255, 0.102);
    transition: all 0.8s ease;
    filter: blur(0.5rem);
  }
  :hover::before {
    top: 50%;
    right: 10%;
    filter: blur(0rem);
  }
`;

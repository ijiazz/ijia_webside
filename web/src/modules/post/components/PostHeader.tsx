import { useThemeToken } from "@/global-provider.tsx";
import styled from "@emotion/styled";
import { Space } from "antd";
import React, { CSSProperties } from "react";

export type PostHeaderProps = {
  userName?: React.ReactNode;
  platformIcon?: React.ReactNode;
  publishTime?: string | null;
  updateTime?: string | null;
  ipLocation?: string | null;

  style?: CSSProperties;
};

export function PostHeader(props: PostHeaderProps) {
  const theme = useThemeToken();
  return (
    <PostHeaderCSS style={props.style}>
      <Space>
        <span className="post-header-owner-name">{props.userName}</span>
        <span className="post-header-platform">{props.platformIcon}</span>
      </Space>
      <div className="post-header-subtitle" style={{ color: theme.colorTextDescription, fontSize: theme.fontSizeSM }}>
        <span className="post-header-time">{props.publishTime}</span>
        <span className="post-header-time">{props.updateTime ? `更新于 ${props.updateTime}` : undefined}</span>
        <span> {props.ipLocation ? "IP: " + props.ipLocation : undefined}</span>
      </div>
    </PostHeaderCSS>
  );
}
const PostHeaderCSS = styled.div`
  .post-header {
    &-owner-name {
      font-weight: 500;
    }
    &-platform {
    }
    &-subtitle {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      .post-header-time {
        white-space: nowrap;
      }
    }
  }
`;

import styled from "@emotion/styled";
import { Space, Typography } from "antd";
import React, { CSSProperties } from "react";

const { Text } = Typography;
export type PostHeaderProps = {
  userName?: React.ReactNode;
  platformIcon?: React.ReactNode;
  publishTime?: string | null;
  updateTime?: string | null;
  ipLocation?: string | null;

  style?: CSSProperties;
};

export function PostHeader(props: PostHeaderProps) {
  return (
    <PostHeaderCSS style={props.style}>
      <Space>
        <span className="post-header-owner-name">{props.userName}</span>
        <span className="post-header-platform">{props.platformIcon}</span>
      </Space>
      <Text className="post-header-subtitle" type="secondary">
        <span className="post-header-time">{props.publishTime}</span>
        <span className="post-header-time">{props.updateTime ? `更新于 ${props.updateTime}` : undefined}</span>
        <span> {props.ipLocation ? "IP: " + props.ipLocation : undefined}</span>
      </Text>
    </PostHeaderCSS>
  );
}
const PostHeaderCSS = styled.div`
  .post-header {
    &-owner-name {
      font-weight: 500;
      font-size: 14px;
    }
    &-platform {
    }
    &-subtitle {
      font-size: 12px;
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

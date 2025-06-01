import { useThemeToken } from "@/hooks/antd.ts";
import { Space } from "antd";
import React from "react";

export type PostHeaderProps = {
  userName?: React.ReactNode;
  platformIcon?: React.ReactNode;
  publishTime?: React.ReactNode;
  ipLocation?: string | null;
  extra?: React.ReactNode;
};

export function PostHeader(props: PostHeaderProps) {
  const theme = useThemeToken();
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        <Space>
          <b>{props.userName}</b>
          <span>{props.platformIcon}</span>
        </Space>
        <div style={{ color: theme.colorTextDescription, fontSize: theme.fontSizeSM }}>
          <Space>
            {props.publishTime}
            <span> {props.ipLocation ? "IP: " + props.ipLocation : undefined}</span>
          </Space>
        </div>
      </div>
      <div>{props.extra}</div>
    </div>
  );
}

import React from "react";
import { ExportOutlined, MessageOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { VLink } from "@/lib/components/VLink.tsx";
import { LikeButton } from "./LikeButton.tsx";

export function PostFooter(props: {
  onPostLike?: (isCancel: boolean) => void;
  likeCount?: number;
  likeDisabled?: boolean;
  isLike?: boolean;

  onOpenComment?: () => void;
  commentCount?: number;
  commentDisabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
      }}
    >
      <VLink style={{ color: "inherit" }} target="_blank">
        <Button type="text" icon={<ExportOutlined />} style={{ fontSize: 16, width: "100%" }}></Button>
      </VLink>
      <Button
        disabled={props.commentDisabled}
        style={{ fontSize: 16, width: "100%" }}
        icon={<MessageOutlined />}
        type="text"
      >
        {props.commentCount}
      </Button>
      <LikeButton
        disabled={props.likeDisabled}
        isLike={props.isLike}
        onTrigger={(isCancel) => props.onPostLike?.(isCancel)}
        style={{ fontSize: 16, width: "100%" }}
      >
        {props.likeCount}
      </LikeButton>
    </div>
  );
}

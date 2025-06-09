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
        <Button
          className="e2e-post-item-detail-open"
          type="text"
          icon={<ExportOutlined />}
          style={{ fontSize: 16, width: "100%" }}
        ></Button>
      </VLink>
      <Button
        className="e2e-post-item-comment-open"
        style={{ fontSize: 16, width: "100%" }}
        icon={<MessageOutlined />}
        type="text"
      >
        {props.commentCount}
      </Button>
      <LikeButton
        className="e2e-post-item-like-btn"
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

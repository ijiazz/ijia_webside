import { Button, Tag, Typography } from "antd";
import React from "react";
import { LikeButton } from "../LikeButton.tsx";
import { PostCommentNode } from "./api.ts";
const { Text } = Typography;

export function CommentFooter(props: {
  node: PostCommentNode;
  onLike?: (isCancel: boolean) => void;
  onReply?: () => void;
}) {
  const { node, onLike, onReply } = props;
  const currUser = node.curr_user;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <Text type="secondary" style={{ fontSize: "inherit" }}>
          {node.create_time_str}
        </Text>
        <Button size="small" style={{ fontSize: "inherit" }} type="text" onClick={onReply} disabled={!currUser}>
          回复
        </Button>
        {node.curr_user?.is_report ? (
          <Tag color="red">已举报</Tag>
        ) : (
          <LikeButton
            className="e2e-post-comment-like-btn"
            disabled={!node.curr_user}
            isLike={node.curr_user?.is_like}
            onTrigger={(isCancel) => onLike?.(isCancel)}
            style={{ fontSize: "inherit" }}
            size="small"
          >
            {node.like_count}
          </LikeButton>
        )}
      </div>
      <LikeButton
        size="small"
        className="e2e-post-comment-like-btn"
        disabled={!currUser}
        isLike={currUser?.is_like}
        onTrigger={onLike}
        style={{
          fontSize: 12,
          display: "none", //TODO 评论点赞
        }}
      >
        {node.like_count}
      </LikeButton>
    </div>
  );
}

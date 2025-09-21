import React from "react";
import { CommentList } from "./comment/PostCommentList.tsx";
import { Drawer } from "antd";
import { LayoutDirection, useLayoutDirection } from "@/global-provider.tsx";

export function CommentDrawer(props: {
  open?: boolean;
  onClose?: () => void;
  postId?: string | number | null;
  isSelf?: boolean;
}) {
  const { onClose, postId: postId, open, isSelf } = props;

  const isHorizontal = useLayoutDirection() === LayoutDirection.Horizontal;
  const postIdNum = typeof postId === "string" ? +postId : typeof postId === "number" ? postId : undefined;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={450}
      height="60%"
      title="评论"
      placement={isHorizontal ? "right" : "bottom"}
      styles={{
        body: {
          padding: 14,
        },
        header: {
          padding: 8,
        },
      }}
    >
      <CommentList postId={postIdNum} isSelf={isSelf} />
    </Drawer>
  );
}

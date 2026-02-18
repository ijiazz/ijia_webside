import { CommentList } from "./comment/PostCommentList.tsx";
import { Drawer, Spin } from "antd";
import { LayoutDirection, useLayoutDirection } from "@/provider/mod.tsx";
import { Suspense } from "react";

export function CommentDrawer(props: {
  open?: boolean;
  onClose?: () => void;
  /** 需要根据 postId 获取评论权限 */
  postId?: string | number | null;
}) {
  const { onClose, postId: postId, open } = props;

  const isHorizontal = useLayoutDirection() === LayoutDirection.Horizontal;
  const postIdNum = typeof postId === "string" ? +postId : typeof postId === "number" ? postId : undefined;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="评论"
      size={isHorizontal ? 450 : "60%"}
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
      <Suspense fallback={<Spin />}>{postIdNum !== undefined && <CommentList postId={postIdNum} />}</Suspense>
    </Drawer>
  );
}

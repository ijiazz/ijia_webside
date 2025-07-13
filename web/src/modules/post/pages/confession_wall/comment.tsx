import React from "react";
import { CommentList } from "../../components/comment/PostCommentList.tsx";
import { Drawer } from "antd";
import { LayoutDirection, useLayoutDirection } from "@/global-provider.tsx";

export function CommentDrawer(props: { onClose?: () => void; postId?: string | number | null }) {
  const { onClose, postId: postId } = props;
  const open = !!postId;

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
      <CommentList postId={postIdNum} />
    </Drawer>
  );
}

const OPEN_COMMENT_POST_ID_KEY = "openCommentPostId";

export function useCommentDrawer(search: URLSearchParams, setSearch: (params: URLSearchParams) => void) {
  const onOpenComment = (postId: number) => {
    const u = new URLSearchParams(location.search);
    u.set(OPEN_COMMENT_POST_ID_KEY, postId.toString());
    setSearch(u);
  };
  const commentId = search.get(OPEN_COMMENT_POST_ID_KEY);
  const closeCommentDrawer = () => {
    const newParams = new URLSearchParams(search);
    newParams.delete(OPEN_COMMENT_POST_ID_KEY);
    setSearch(newParams);
  };
  return {
    onOpenComment,
    closeCommentDrawer,
    commentId: commentId,
  };
}

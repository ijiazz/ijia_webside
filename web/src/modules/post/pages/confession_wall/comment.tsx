import React, { useEffect, useState } from "react";
import { CommentList } from "../../components/comment/PostCommentList.tsx";
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

const OPEN_COMMENT_POST_ID_KEY = "openCommentPostId";

export function useCommentDrawer(search: URLSearchParams, setSearch: (params: URLSearchParams) => void) {
  const onOpenComment = (postId: number) => {
    const u = new URLSearchParams(location.search);
    u.set(OPEN_COMMENT_POST_ID_KEY, postId.toString());
    setSearch(u);
  };

  const [commentId, setCommentId] = useState<number | undefined>();

  const searchCommentId = search.get(OPEN_COMMENT_POST_ID_KEY);
  useEffect(() => {
    if (searchCommentId) {
      setCommentId(+searchCommentId);
    }
  }, [searchCommentId]);

  const closeCommentDrawer = () => {
    const newParams = new URLSearchParams(search);
    newParams.delete(OPEN_COMMENT_POST_ID_KEY);
    setSearch(newParams);
  };
  return {
    onOpenComment,
    closeCommentDrawer,
    open: !!searchCommentId,
    commentId: commentId,
  };
}

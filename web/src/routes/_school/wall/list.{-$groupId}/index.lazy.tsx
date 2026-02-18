import { createLazyFileRoute, NavigateOptions, useNavigate } from "@tanstack/react-router";

import { useState } from "react";
import { CommentDrawer } from "../../-components/comment.tsx";
import { PublicPostList } from "./-components/PostList.tsx";

export const Route = createLazyFileRoute("/_school/wall/list/{-$groupId}/")({
  component: RouteComponent,
});

function RouteComponent() {
  const drawer = useCommentDrawer();

  return (
    <>
      <PublicPostList onOpenComment={drawer.onOpenComment} />
      <CommentDrawer postId={drawer.postId} open={drawer.open} onClose={drawer.closeCommentDrawer} />
    </>
  );
}

function useCommentDrawer() {
  const { openCommentPostId } = Route.useSearch();
  const navigate = useNavigate();

  const onOpenComment = (postId: number) => {
    setPostId(postId);
    const options: NavigateOptions = {
      search: (prev: any) => ({ ...prev, openCommentPostId: postId }),
      viewTransition: true,
    };
    navigate(options);
  };

  const [postId, setPostId] = useState<number | undefined>(openCommentPostId);

  const closeCommentDrawer = () => {
    const options: NavigateOptions = {
      search: ({ openCommentPostId, ...prev }: any) => prev,
      viewTransition: true,
    };
    navigate(options);
  };
  return {
    onOpenComment,
    closeCommentDrawer,
    open: openCommentPostId !== undefined,
    postId: postId,
  };
}

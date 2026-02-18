import { createLazyFileRoute, useLoaderData } from "@tanstack/react-router";
import { UserPostList } from "./-components/UserPostList.tsx";
import { CommentDrawer } from "@/routes/_school/-components/comment.tsx";
import { useState } from "react";

export const Route = createLazyFileRoute("/_school/user/$userId/post/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { userInfo: currentUser } = useLoaderData({ from: "/_school" });
  const { userId }: { userId: number } = Route.useParams({
    select(params) {
      return {
        userId: Number.parseInt(params.userId),
      };
    },
  });
  const isSelf = !!currentUser && currentUser.user_id === userId;
  const commentDrawer = useCommentDrawer();

  return (
    <div>
      <UserPostList canEdit={isSelf} hideReport={isSelf} userId={userId} onOpenComment={commentDrawer.onOpenComment} />

      <CommentDrawer
        postId={commentDrawer.postId}
        open={commentDrawer.open}
        onClose={commentDrawer.closeCommentDrawer}
      />
    </div>
  );
}
function useCommentDrawer() {
  const { openCommentPostId } = Route.useSearch();
  const navigate = Route.useNavigate();

  const onOpenComment = (postId: number) => {
    setPostId(postId);
    navigate({
      search: (prev) => ({ ...prev, openCommentPostId: postId }),
      viewTransition: true,
    });
  };

  const [postId, setPostId] = useState<number | undefined>(openCommentPostId);

  const closeCommentDrawer = () => {
    navigate({
      search: ({ openCommentPostId, ...prev }) => prev,
      viewTransition: true,
    });
  };
  return {
    onOpenComment,
    closeCommentDrawer,
    open: openCommentPostId !== undefined,
    postId: postId,
  };
}

import { CommentDrawer, CommentDrawerProps, CommentList } from "../comment.tsx";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getPostQueryOption } from "@/request/post.ts";

export type PostCommentDrawerProps = Pick<CommentDrawerProps, "onClose" | "open"> & {
  postId?: string;
};
export function PostCommentDrawer(props: PostCommentDrawerProps) {
  const { postId, ...rest } = props;

  return (
    <CommentDrawer {...rest} getResetKey={postId}>
      {postId && <PostCommentList postId={postId} />}
    </CommentDrawer>
  );
}

function PostCommentList(props: { postId: string }) {
  const { postId } = props;
  const { data } = useSuspenseQuery({ ...getPostQueryOption({ postId }), staleTime: Infinity });
  const post = data.item;
  const commentTreeId = post.comment_tree_id;
  if (!commentTreeId) {
    return <div>没有评论</div>;
  }
  return (
    <CommentList
      key={post.comment_tree_id}

      commentTreeId={commentTreeId}
      createDisabled={post.curr_user ? post.curr_user.disabled_comment_reason : "登录后可以评论"}
    />
  );
}

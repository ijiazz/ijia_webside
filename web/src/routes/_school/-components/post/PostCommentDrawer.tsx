import { api } from "@/request/client.ts";
import { CommentDrawer, CommentDrawerProps } from "../comment.tsx";
import { CommentListConfig } from "../comment/CommentList.tsx";

export type PostCommentDrawerProps = Pick<CommentDrawerProps, "onClose" | "open"> & {
  postId?: string;
};
export function PostCommentDrawer(props: PostCommentDrawerProps) {
  const { postId, ...rest } = props;

  return (
    <CommentDrawer
      {...rest}
      overwrite={async () => {
        const { item } = await api["/post/entity/:postId"].get({ params: { postId } });
        return {
          commentTreeId: item.comment_tree_id ?? undefined,
          createDisabled: item.curr_user ? item.curr_user.disabled_comment_reason : "登录后可以评论",
        } satisfies CommentListConfig;
      }}
    />
  );
}

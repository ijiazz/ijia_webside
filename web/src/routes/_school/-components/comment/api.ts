import { CommentDTO, GetCommentListInput } from "@/api.ts";
import { api } from "@/request/client.ts";
import { CommentNode } from "./CommentItem.tsx";
import { dateToString } from "@/common/date.ts";

export type CommentVoNode = Omit<CommentDTO, "children" | "create_time"> &
  CommentNode & {
    create_time_str: string;
    loading?: boolean; // 是否正在加载子评论
    hasMore?: boolean;
    childrenCursor?: string | null;
  };

export async function createComment(
  commentTreeId: string,
  data: { text: string },
  replyCommentId?: string | null,
): Promise<string> {
  const { comment_id } = await api["/comment"].put({
    body: {
      comment_tree_id: commentTreeId,
      text: data.text,
      comment_reply_id: replyCommentId ?? undefined,
    },
  });

  return comment_id;
}

export function commentDtoToCommentNode(item: CommentDTO, parent: CommentVoNode | null): CommentVoNode {
  const { children, create_time, ...reset } = item;

  const node = reset as CommentVoNode;
  node.key = node.comment_id;
  node.create_time_str = dateToString(create_time * 1000, "second");

  node.parent = parent ?? null;
  if (children) {
    node.children = new Map<string | number, CommentVoNode>();
    for (let i = 0; i < children.length; i++) {
      node.children.set(children[i].comment_id, commentDtoToCommentNode(children[i], node));
    }
  }
  node.hasMore = !!(node.is_root_reply_count && (!node.children || node.children.size < node.is_root_reply_count));
  return node;
}

export function loadCommentList(query: GetCommentListInput) {
  return api["/get-comment/list"].get({
    query: query,
  });
}
export async function loadComment(commentId: string): Promise<CommentDTO | undefined> {
  const res = await loadCommentList({ commentId: commentId });
  return res.items[0];
}

export async function loadCommentItem(node: CommentVoNode): Promise<CommentVoNode | undefined> {
  const comment = await loadComment(node.comment_id);
  if (!comment) return;
  return commentDtoToCommentNode(comment, node);
}

export async function setCommentLike(commentId: string, isCancel: boolean): Promise<boolean> {
  const { success } = await api["/comment/:commentId/like"].post({
    params: { commentId },
    query: { isCancel },
  });
  return success;
}

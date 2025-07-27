import { GetPostCommentListParam, PostCommentDto } from "@/api.ts";
import { api } from "@/common/http.ts";
import { CommentNode } from "./CommentItem.tsx";
import { dateToString } from "@/common/date.ts";

export type PostCommentNode = Omit<PostCommentDto, "children" | "create_time"> &
  CommentNode & {
    create_time_str: string;
    loading?: boolean; // 是否正在加载子评论
    hasMore?: boolean;
    childrenCursor?: string | null;
  };

export async function createComment(
  postId: number,
  data: { text: string },
  replyCommentId?: number | null,
): Promise<number> {
  const { id } = await api["/post/content/:postId/comment"].put({
    params: {
      postId: +postId,
    },
    body: {
      text: data.text,
      replyCommentId: typeof replyCommentId === "number" ? replyCommentId : undefined,
    },
  });

  return id;
}

export function commentDtoToCommentNode(item: PostCommentDto, parent: PostCommentNode | null): PostCommentNode {
  const { children, create_time, ...reset } = item;

  const node = reset as PostCommentNode;
  node.key = node.comment_id;
  node.create_time_str = dateToString(create_time * 1000, "second");

  node.parent = parent ?? null;
  if (children) {
    node.children = new Map<string | number, PostCommentNode>();
    for (let i = 0; i < children.length; i++) {
      node.children.set(children[i].comment_id, commentDtoToCommentNode(children[i], node));
    }
  }
  node.hasMore = !!(node.is_root_reply_count && (!node.children || node.children.size < node.is_root_reply_count));
  return node;
}
export function getPostData(postId: number, isSelf?: boolean) {
  return api["/post/list"].get({ query: { post_id: postId, self: isSelf } }).then((res) => {
    const item = res.items[0];
    if (item.post_id !== postId) return;

    return item;
  });
}
export function loadCommentList(postId: number, query?: GetPostCommentListParam) {
  return api["/post/content/:postId/comment"].get({
    params: { postId },
    query: query,
  });
}
export function loadCommentReplyList(commentId: number, query?: GetPostCommentListParam) {
  return api["/post/comment/entity/:commentId/root_list"].get({
    params: { commentId: commentId },
    query: query,
  });
}

export async function loadCommentItem(node: PostCommentNode): Promise<PostCommentNode[]> {
  let res: PostCommentNode[];
  debugger;
  if (typeof node.root_comment_id === "number") {
    const { items } = await api["/post/comment/entity/:commentId/root_list"].get({
      params: { commentId: node.root_comment_id },
      query: { commentId: node.comment_id },
    });
    res = items.map((item) => commentDtoToCommentNode(item, node));
  } else {
    const { items } = await api["/post/content/:postId/comment"].get({
      params: { postId: node.post_id },
      query: { commentId: node.comment_id },
    });
    res = items.map((item) => commentDtoToCommentNode(item, null));
  }
  return res;
}

export async function setCommentLike(commentId: number, isCancel: boolean): Promise<boolean> {
  const { success } = await api["/post/comment/like/:commentId"].post({
    params: { commentId },
    query: { isCancel },
  });
  return success;
}

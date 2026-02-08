import { useAsync } from "@/hooks/async.ts";
import { Avatar, Button, Divider, Input, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { PostCommentDto } from "@/api.ts";
import { CommentTree, useCommentData, findNodeRoot } from "./CommentItem.tsx";
import { VLink } from "@/lib/components/VLink.tsx";
import { CloseOutlined, UserOutlined } from "@ant-design/icons";
import { api } from "@/request/client.ts";
import { useAntdStatic } from "@/provider/mod.tsx";
import { ReportModal } from "../ReportModal.tsx";
import {
  commentDtoToCommentNode,
  createComment,
  loadCommentItem,
  loadCommentList,
  PostCommentNode,
  setCommentLike,
  loadComment,
} from "./api.ts";
import { CommentHeader } from "./CommentHeader.tsx";
import { CommentFooter } from "./CommentFooter.tsx";
import { useQuery } from "@tanstack/react-query";
import { getPostListQueryOption } from "@/request/post.ts";

const { Text } = Typography;

export type CreateData = {
  text: string;
};
export function CommentList(props: { postId?: number; allowAll?: boolean }) {
  const { postId, allowAll } = props;
  const {
    commentData,
    addItem,
    deleteItem,
    pushList,
    reset: resetData,
    forceRender,
    replaceItem,
  } = useCommentData<PostCommentNode>();
  const { message, modal } = useAntdStatic();
  const { isFetching: postInfoLoading, data } = useQuery({
    ...getPostListQueryOption({ post_id: postId! }),
    enabled: typeof postId === "number",
  });
  const postInfo = postInfoLoading ? null : data?.items[0];

  const config = useMemo(() => {
    if (allowAll) return { createDisabled: undefined };

    let createDisabled: string | undefined = "";
    if (postInfo) {
      createDisabled = postInfo.curr_user ? postInfo.curr_user.disabled_comment_reason : "登录后可以评论";
    } else if (postInfoLoading) {
      createDisabled = "加载中...";
    } else createDisabled = "暂时无法评论";
    return {
      createDisabled,
    };
  }, [postInfo, postInfoLoading, allowAll]);

  const loadRoot = useAsync(async (nextCursor?: string | null) => {
    if (typeof postId !== "number") return undefined;

    const res = await loadCommentList({ postId, cursor: nextCursor ?? undefined, number: 10 });
    const nodeList = res.items.map((item) => commentDtoToCommentNode(item, null));
    pushList(nodeList);
    return res;
  });

  const loadReply = useAsync(async function (parent: PostCommentNode) {
    parent.loading = true;
    forceRender();
    let nodeList: PostCommentNode[];
    try {
      const res = await loadCommentList({
        parentCommentId: parent.comment_id,
        cursor: parent.childrenCursor ?? undefined,
        number: 5,
      });
      nodeList = res.items.map((item) => commentDtoToCommentNode(item, parent));
      parent.hasMore = !!res.cursor_next;
      parent.childrenCursor = res.cursor_next;
    } catch (error) {
      parent.loading = false;
      forceRender();
      throw error;
    }
    parent.loading = false;
    pushList(nodeList, parent);
  });

  const { loading: commentLoading, run: commentCreateComment } = useAsync(async function (
    postId: number,
    text: string,
  ) {
    const replyId = replyingComment?.comment_id ?? null;
    const newCommendId = await createComment(postId, { text }, replyId);
    setText("");
    setReplyingComment(null);
    let comment: PostCommentDto | undefined;
    try {
      comment = await loadComment(newCommendId);
    } catch (error) {
      message.error("已创建评论但刷新失败，请手动刷新评论");
      throw error;
    }
    if (comment) {
      const addTarget = replyingComment ? findNodeRoot(replyingComment) : null;
      addItem(commentDtoToCommentNode(comment, addTarget), addTarget);
    }
  }, {});

  const { reloadItem, onLike } = useReload({ replaceItem });

  const onCreateComment = () => {
    if (typeof postId !== "number") return;

    if (!text || /^\s+$/.test(text)) {
      message.error("评论不能为空");
      return;
    }
    commentCreateComment(postId, text);
  };

  const deleteComment = (node: PostCommentNode) => {
    modal.confirm({
      title: "确认删除？",
      async onOk(...args) {
        await api["/post/comment/entity/:commentId"].delete({ params: { commentId: node.comment_id } });
        deleteItem(node);
      },
    });
  };

  useEffect(() => {
    resetData();
    loadRoot.run();
  }, [postId]);

  const [text, setText] = useState<string | undefined>();
  const [replyingComment, setReplyingComment] = useState<PostCommentNode | null>(null);

  const [reportOpen, setReportOpen] = useState<PostCommentNode | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <div style={{ flex: 1, overflow: "auto" }}>
        <CommentTree<PostCommentNode>
          className="e2e-post-comment-item"
          avatarRender={(node) => {
            const user = node.user;
            return (
              <VLink to={undefined} target="_blank">
                <Avatar size="small" icon={user.avatar_url ? undefined : <UserOutlined />} src={user.avatar_url} />
              </VLink>
            );
          }}
          headerRender={(node) => (
            <div e2e-comment-header-id={node.comment_id} className="e2e-post-comment-header">
              <CommentHeader
                node={node}
                onDelete={() => deleteComment(node)}
                onReport={() => {
                  setReportOpen(node);
                }}
              />
            </div>
          )}
          contentRender={(data, children) => {
            return (
              <div>
                <div className="e2e-post-comment-content">
                  {data.content_text}
                  <CommentFooter
                    node={data}
                    onLike={() => {
                      onLike(data, !!data.curr_user?.is_like);
                    }}
                    onReply={() => {
                      setReplyingComment(data);
                    }}
                  />
                </div>
                {children}
                {data.hasMore && (
                  <Button type="link" loading={data.loading} size="small" onClick={() => loadReply.run(data)}>
                    {data.children?.size ? "佳载更多" : `展开${data.is_root_reply_count}条回复`}
                  </Button>
                )}
              </div>
            );
          }}
          data={commentData}
        />
        <div style={{ textAlign: "center" }}>
          {loadRoot.data?.cursor_next ? (
            <Button type="link" onClick={() => loadRoot.run(loadRoot.data!.cursor_next)} loading={loadRoot.loading}>
              佳载更多
            </Button>
          ) : (
            <Divider plain>可恶，没有更多了</Divider>
          )}
        </div>
      </div>
      <div style={{ paddingTop: 12, display: "flex", gap: 8, flexDirection: "column" }}>
        {replyingComment && (
          <div style={{ display: "flex", gap: 12 }}>
            <div>回复</div>
            <div style={{ flex: 1 }}>
              <Text type="secondary">{replyingComment.user.user_name}</Text>
              <div>{replyingComment.content_text}</div>
            </div>
            <Button
              icon={<CloseOutlined />}
              type="text"
              onClick={() => setReplyingComment(null)}
              aria-label="取消回复"
            />
          </div>
        )}
        <Input.TextArea
          aria-label="评论内容输入框"
          disabled={!!config.createDisabled}
          placeholder={config.createDisabled}
          value={text}
          onChange={(text) => setText(text.currentTarget.value)}
        />
        <div style={{ textAlign: "right" }}>
          {!config.createDisabled && (
            <Button type="primary" loading={commentLoading} onClick={() => onCreateComment()}>
              发送
            </Button>
          )}
        </div>
      </div>
      <ReportModal
        title={`举报：${reportOpen?.content_text?.slice(0, 20) ?? ""}`}
        open={!!reportOpen}
        onClose={() => setReportOpen(null)}
        onSubmit={async (reason) => {
          if (!reportOpen) return;
          const { success } = await api["/post/comment/entity/:commentId/report"].post({
            body: { reason },
            params: { commentId: reportOpen.comment_id },
          });
          message.success("举报成功");
          setReportOpen(null);
          if (success) {
            replaceItem(reportOpen, (old) => {
              if (!old.curr_user) return old;
              old.curr_user.is_report = true;
              return old;
            });
          }
        }}
      />
    </div>
  );
}

function useReload(config: {
  replaceItem: (
    find: PostCommentNode,
    replace?: (old: PostCommentNode, find: PostCommentNode) => PostCommentNode,
  ) => void;
}) {
  const { replaceItem } = config;
  const reloadingRef = useRef<Record<number, Promise<unknown>>>({} as any);

  const { message } = useAntdStatic();

  const reloadItem = (node: PostCommentNode) => {
    const id = node.comment_id;
    const reloadIng = reloadingRef.current;
    const promise = loadCommentItem(node)
      .then((item) => {
        if (reloadIng[id] === undefined) return; // 已被后调用来的更新
        if (!item) return;
        ref.current.replaceItem(item); // 直接替换
      })
      .finally(() => {
        if (reloadIng[id] === promise) delete reloadIng[id];
      });
    reloadIng[id] = promise;
    return promise;
  };

  const refObject = { reloadItem, replaceItem };
  const ref = useRef(refObject);
  ref.current = refObject;

  const onLike = (node: PostCommentNode, isCancel: boolean) => {
    const id = node.comment_id;
    replaceItem(node, (old) => {
      const c = old.curr_user;
      if (c) {
        c.is_like = !isCancel;
        if (isCancel) old.like_count--;
        else old.like_count++;
      }
      return old;
    });
    const reloading = reloadingRef.current;
    const promise = setCommentLike(id, isCancel);
    if (!reloading[id]) {
      reloading[id] = promise;
    }

    promise
      .catch((error) => {
        console.error(error);
        message.error(isCancel ? "取消点赞失败" : "点赞失败");
        return false;
      })
      .then((success: boolean) => {
        if (reloading[id] === promise) {
          //这个过程这个帖子没有被请求刷新过
          delete reloading[id];
          if (!success) {
            ref.current.replaceItem(node, (old) => {
              const c = old.curr_user;
              if (c) {
                c.is_like = !c.is_like;
                if (isCancel) old.like_count++;
                else old.like_count--;
              }
              return old;
            });
          }
        } else {
          return ref.current.reloadItem(node);
        }
      });
  };

  return {
    onLike,
    reloadItem,
  };
}

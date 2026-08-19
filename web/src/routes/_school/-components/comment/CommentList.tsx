import { Avatar, Button, Input, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { CommentDTO, GetCommentListOutput } from "@/api.ts";
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
  CommentVoNode,
  setCommentLike,
  loadComment,
} from "./api.ts";
import { CommentHeader } from "./CommentHeader.tsx";
import { CommentFooter } from "./CommentFooter.tsx";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { LoadMoreIndicator } from "@/components/LoadMoreIndicator.tsx";
import { useModal } from "@/components/Modal.ts";

const { Text } = Typography;

export type CommentListConfig = {
  createDisabled?: string | undefined;
  commentTreeId?: string;
};
export type CommentListProps = CommentListConfig & {
  /** 覆盖配置 */
  overwrite?: () => Promise<CommentListConfig>;
};
export function CommentList(props: CommentListProps) {
  const { commentTreeId, createDisabled } = useConfig(props);

  const {
    commentData,
    addItem,
    deleteItem,
    pushList,
    reset: resetData,
    forceRender,
    replaceItem,
  } = useCommentData<CommentVoNode>();

  const { message } = useAntdStatic();
  const modals = useModal();
  const loadRoot = useMutation({
    mutationFn: async (param: { commentTreeId?: string; cursor?: string | null }) => {
      if (!param.commentTreeId) {
        return { items: [] } satisfies GetCommentListOutput;
      }
      return loadCommentList({ commentTreeId: param.commentTreeId, cursor: param.cursor ?? undefined, number: 10 });
    },
    onSuccess(res) {
      const nodeList = res.items.map((item) => commentDtoToCommentNode(item, null));
      pushList(nodeList);
    },
  });
  const { mutateAsync: loadReply } = useMutation({
    onMutate(parent, context) {
      parent.loading = true;
      forceRender();
    },
    mutationFn: async (parent: CommentVoNode) => {
      return loadCommentList({
        parentCommentId: parent.comment_id,
        cursor: parent.childrenCursor ?? undefined,
        number: 5,
      });
    },
    async onSuccess(res, parent) {
      const nodeList = res.items.map((item) => commentDtoToCommentNode(item, parent));
      parent.hasMore = !!res.cursor_next;
      parent.childrenCursor = res.cursor_next;

      parent.loading = false;
      pushList(nodeList, parent);
    },
    onError(error, parent) {
      parent.loading = false;
      forceRender();
    },
  });

  const { isPending: commentLoading, mutateAsync: submitCreateComment } = useMutation({
    mutationFn: async (param: { commentTreeId: string; text: string; replyId?: string }) => {
      const { commentTreeId, text, replyId } = param;
      return createComment(commentTreeId, { text }, replyId);
    },
    onSuccess: async (newCommendId) => {
      setText("");
      setReplyingComment(null);
      let comment: CommentDTO | undefined;
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
    },
  });

  const commentCreateComment = async (commentTreeId: string, text: string) => {
    const replyId = replyingComment?.comment_id ?? null;
    await submitCreateComment({
      commentTreeId,
      text,
      replyId: replyId ?? undefined,
    });
  };
  const { reloadItem, onLike } = useReload({ replaceItem });

  const onCreateComment = () => {
    if (!commentTreeId) return;
    if (!text || /^\s+$/.test(text)) {
      message.error("评论不能为空");
      return;
    }
    commentCreateComment(commentTreeId, text);
  };

  const deleteComment = (node: CommentVoNode) => {
    modals.confirm({
      title: "确认删除？",
      async onOk(...args) {
        await api["/comment/:commentId"].delete({ params: { commentId: node.comment_id } });
        deleteItem(node);
      },
    });
  };

  useEffect(() => {
    resetData();
    loadRoot.mutate({ commentTreeId });
  }, [commentTreeId]);

  const [text, setText] = useState<string | undefined>();
  const [replyingComment, setReplyingComment] = useState<CommentVoNode | null>(null);

  const [reportOpen, setReportOpen] = useState<CommentVoNode | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <div style={{ flex: 1, overflow: "auto" }}>
        <CommentTree<CommentVoNode>
          avatarRender={(node) => {
            const user = node.user;
            return (
              <VLink to={undefined} target="_blank">
                <Avatar size="small" icon={user.avatar_url ? undefined : <UserOutlined />} src={user.avatar_url} />
              </VLink>
            );
          }}
          headerRender={(node) => (
            <div className="e2e-comment-header" data-testid={`comment-header-${node.comment_id}`}>
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
                <div className="e2e-comment-content" data-testid={`comment-content-${data.comment_id}`}>
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
                  <Button type="link" loading={data.loading} size="small" onClick={() => loadReply(data)}>
                    {data.children?.size ? "佳载更多" : `展开${data.is_root_reply_count}条回复`}
                  </Button>
                )}
              </div>
            );
          }}
          data={commentData}
        />

        <LoadMoreIndicator
          error={!!loadRoot.error}
          hasMore={!!loadRoot.data?.cursor_next}
          isEmpty={commentData.size === 0}
          loading={loadRoot.isPending}
          onLoad={() => {
            if (!commentTreeId) return;
            loadRoot.mutate({ commentTreeId, cursor: loadRoot.data?.cursor_next });
          }}
        />
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
          disabled={!!createDisabled}
          placeholder={createDisabled}
          value={text}
          onChange={(text) => setText(text.currentTarget.value)}
        />
        <div style={{ textAlign: "right" }}>
          {!createDisabled && (
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
          const { success } = await api["/comment/:commentId/report"].post({
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
  replaceItem: (find: CommentVoNode, replace?: (old: CommentVoNode, find: CommentVoNode) => CommentVoNode) => void;
}) {
  const { replaceItem } = config;
  const reloadingRef = useRef<Record<string, Promise<unknown>>>({});

  const { message } = useAntdStatic();

  const reloadItem = (node: CommentVoNode) => {
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

  const onLike = (node: CommentVoNode, isCancel: boolean) => {
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

function useConfig(props: CommentListProps): CommentListConfig {
  const { overwrite: configInput, commentTreeId, createDisabled } = props;
  const { isLoading, data } = useSuspenseQuery({ queryKey: [], queryFn: configInput });
  if (typeof configInput === "function") {
    return isLoading ? { createDisabled: "加载中..." } : data;
  }
  return { commentTreeId, createDisabled, ...data };
}

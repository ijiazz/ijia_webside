import { useAsync } from "@/hooks/async.ts";
import { Avatar, Button, Divider, Input, Typography } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PostCommentResponse } from "@/api.ts";
import { CommentTree, useCommentData, findNodeRoot } from "./CommentItem.tsx";
import { VLink } from "@/lib/components/VLink.tsx";
import { CloseOutlined, UserOutlined } from "@ant-design/icons";
import { api } from "@/common/http.ts";
import { useAntdStatic } from "@/global-provider.tsx";
import { ReportModal } from "../ReportModal.tsx";
import {
  commentDtoToCommentNode,
  createComment,
  getPostData,
  loadCommentItem,
  loadCommentList,
  loadCommentReplyList,
  PostCommentNode,
  setCommentLike,
} from "./api.ts";
import { CommentHeader } from "./CommentHeader.tsx";
import { CommentFooter } from "./CommentFooter.tsx";

const { Text } = Typography;

export type CreateData = {
  text: string;
};
export function CommentList(props: { postId?: number }) {
  const { postId } = props;
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
  const { loading: postInfoLoading, data: postInfo, run: loadPostInfo } = useAsync(getPostData);

  useEffect(() => {
    if (postId !== undefined) loadPostInfo(postId);
  }, [postId]);
  const config = useMemo(() => {
    let reason = "";
    if (postInfoLoading) reason = "加载中...";
    else if (postInfo) {
      if (postInfo.curr_user) {
        reason = postInfo.curr_user.can_comment ? "" : "作者已关闭评论功能";
      } else {
        reason = "登录后可以评论";
      }
    } else reason = "未知错误，无法新增评论";
    return {
      create: {
        reason: reason,
        can: postInfo?.curr_user?.can_comment === true,
      },
    };
  }, [postInfo, postInfoLoading]);

  const loadRoot = useAsync(async (nextCursor?: string | null) => {
    if (typeof postId !== "number") return undefined;

    const res = await loadCommentList(postId, { cursor: nextCursor ?? undefined, number: 10 });
    const nodeList = res.items.map((item) => commentDtoToCommentNode(item, null));
    pushList(nodeList);
    return res;
  });

  const loadReply = useAsync(async function (parent: PostCommentNode) {
    parent.loading = true;
    forceRender();
    let nodeList: PostCommentNode[];
    try {
      const res = await loadCommentReplyList(parent.comment_id, {
        cursor: parent.childrenCursor ?? undefined,
        number: 5,
      });
      nodeList = res.items.map((item) => commentDtoToCommentNode(item, parent));
      parent.hasMore = res.has_more;
      parent.childrenCursor = res.next_cursor;
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
    let res: PostCommentResponse;
    try {
      if (replyingComment) {
        const loadId = replyingComment.root_comment_id ?? replyingComment.comment_id;
        res = await loadCommentReplyList(loadId, { commentId: newCommendId });
      } else {
        res = await loadCommentList(postId, { commentId: newCommendId });
      }
    } catch (error) {
      message.error("已创建评论但刷新失败，请手动刷新评论");
      throw error;
    }
    const comment = res.items[0];
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
          {loadRoot.data?.has_more ? (
            <Button type="link" onClick={() => loadRoot.run(loadRoot.data?.next_cursor)} loading={loadRoot.loading}>
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
            <Button icon={<CloseOutlined />} type="text" onClick={() => setReplyingComment(null)} />
          </div>
        )}
        <Input.TextArea
          disabled={!config.create.can}
          placeholder={config.create.reason}
          value={text}
          onChange={(text) => setText(text.currentTarget.value)}
        />
        <div style={{ textAlign: "right" }}>
          {config.create.can && (
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
          const { success } = await api["/post/comment/report/:commentId"].post({
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
      .then((res) => {
        if (reloadIng[id] === undefined) return; // 已被后调用来的更新

        const item = res[0];
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

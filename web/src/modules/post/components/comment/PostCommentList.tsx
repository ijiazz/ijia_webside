import { useAsync } from "@/hooks/async.ts";
import { Avatar, Button, Divider, Dropdown, Input, MenuProps, Tag, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { GetPostCommentListParam, PostCommentDto, PostCommentResponse } from "@/api.ts";
import { CommentTree, useCommentData, CommentNode, findNodeRoot } from "./CommentItem.tsx";
import { VLink } from "@/lib/components/VLink.tsx";
import { CaretRightOutlined, CloseOutlined, DeleteOutlined, MoreOutlined, UserOutlined } from "@ant-design/icons";
import { api } from "@/common/http.ts";
import { useAntdStatic } from "@/global-provider.tsx";
import { dateToString } from "@/common/date.ts";
import { LikeButton } from "../LikeButton.tsx";
import styled from "@emotion/styled";

const { Text } = Typography;

export type PostCommentNode = Omit<PostCommentDto, "children" | "create_time"> &
  CommentNode & {
    create_time_str: string;
    loading?: boolean; // 是否正在加载子评论
    hasMore?: boolean;
    childrenCursor?: string | null;
  };

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
  } = useCommentData<PostCommentNode>();
  const { message, modal } = useAntdStatic();
  const {
    loading: postInfoLoading,
    data: postInfo,
    run: loadPostInfo,
  } = useAsync(function getPostData(postId: number) {
    return api["/post/list"].get({ query: { post_id: postId } }).then((res) => {
      const item = res.items[0];
      if (item.asset_id !== postId) return;

      return item;
    });
  });

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

  const {
    loading,
    run: loadRootComment,
    data,
  } = useAsync(async (nextCursor?: string | null) => {
    if (typeof postId !== "number") return undefined;

    const res = await loadCommentList(postId, { cursor: nextCursor ?? undefined, number: 10 });
    const nodeList = res.items.map((item) => commentDtoToCommentNode(item, null));
    pushList(nodeList);
    return res;
  });

  const { run: loadReply } = useAsync(async function (parent: PostCommentNode) {
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
    loadRootComment();
  }, [postId]);

  const [text, setText] = useState<string | undefined>();
  const [replyingComment, setReplyingComment] = useState<PostCommentNode | null>(null);

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
              <CommentHeader node={node} onDelete={() => deleteComment(node)} />
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
                      //TODO
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
        <div style={{ textAlign: "center" }}>
          {data?.has_more ? (
            <Button type="link" onClick={() => loadRootComment(data?.next_cursor)} loading={loading}>
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
    </div>
  );
}

function CommentFooter(props: { node: PostCommentNode; onLike?: (isCancel: boolean) => void; onReply?: () => void }) {
  const { node, onLike, onReply } = props;
  const currUser = node.curr_user;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <Text style={{ fontSize: 12 }} type="secondary">
          {node.create_time_str}
        </Text>
        <Button
          size="small"
          className="e2e-post-item-comment-open"
          style={{ fontSize: 12 }}
          type="text"
          onClick={onReply}
          disabled={!currUser}
        >
          回复
        </Button>
      </div>
      <LikeButton
        size="small"
        className="e2e-post-item-like-btn"
        disabled={!currUser}
        isLike={currUser?.is_like}
        onTrigger={onLike}
        style={{
          fontSize: 12,
          display: "none", //TODO 评论点赞
        }}
      >
        {node.like_count}
      </LikeButton>
    </div>
  );
}
type PostHeaderProps = {
  node: PostCommentNode;
  className?: string;
  onDelete?: () => void;
};
function CommentHeader(props: PostHeaderProps) {
  const { node, onDelete, className } = props;

  const menus: MenuProps["items"] = [];
  if (node.curr_user?.can_update) {
    menus.unshift({
      label: "删除",
      icon: <DeleteOutlined />,
      key: "delete",
      onClick: onDelete,
    });
  }
  return (
    <PostCommentHeaderCSS className={className}>
      <div>
        <PostCommentHeaderTextCSS type="secondary">
          <span>{node.user.user_name}</span>
          {node.reply_to && (
            <>
              <CaretRightOutlined />
              <span>{node.reply_to.user.user_name}</span>
              {node.reply_to.is_deleted && (
                <Tag bordered={false} style={{ marginLeft: 4 }}>
                  已删除
                </Tag>
              )}
            </>
          )}
        </PostCommentHeaderTextCSS>
      </div>
      <div>
        {menus.length ? (
          <Dropdown menu={{ items: menus }}>
            <Button icon={<MoreOutlined />} type="text" />
          </Dropdown>
        ) : undefined}
      </div>
    </PostCommentHeaderCSS>
  );
}
const PostCommentHeaderTextCSS = styled(Text)`
  margin-top: 2px;
  > span {
    vertical-align: middle;
  }
`;
const PostCommentHeaderCSS = styled.div`
  display: flex;
  justify-content: space-between;
`;

async function createComment(postId: number, data: { text: string }, replyCommentId?: number | null): Promise<number> {
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

function commentDtoToCommentNode(item: PostCommentDto, parent: PostCommentNode | null): PostCommentNode {
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

function loadCommentList(postId: number, query?: GetPostCommentListParam) {
  return api["/post/content/:postId/comment"].get({
    params: { postId },
    query: query,
  });
}
function loadCommentReplyList(commentId: number, query?: GetPostCommentListParam) {
  return api["/post/comment/entity/:commentId/root_list"].get({
    params: { commentId: commentId },
    query: query,
  });
}

import { Avatar, MenuProps, Space, Tag, Typography } from "antd";
import { PostContent } from "../../../-components/post/PostContent.tsx";
import React, { useMemo } from "react";
import { UserOutlined } from "@ant-design/icons";
import { PinkPostCard } from "../../-components/PinkCard.tsx";
import { PostReviewTarget, PostCommentReviewTarget } from "@/api.ts";
import { useThemeToken } from "@/global-provider.tsx";
import { CommentNode, CommentTree } from "../../../-components/comment/CommentItem.tsx";
import { dateToString } from "@/common/date.ts";
import { CommentHeader } from "../../../-components/comment/CommentHeader.tsx";

export type PostReviewCardProps = {
  item: PostReviewTarget;
  moreMenus?: MenuProps["items"];
};

export function PostReviewCard(props: PostReviewCardProps) {
  const { item, moreMenus } = props;
  const theme = useThemeToken();
  const isAnonymous = false;

  return (
    <PinkPostCard
      icon={<Avatar icon={<UserOutlined />} />}
      header={{
        userName: isAnonymous ? (
          <Tag bordered={false} color={theme.colorTextSecondary}>
            匿名
          </Tag>
        ) : null,
        publishTime: item.publish_time && dateToString(item.publish_time, "day"),
        updateTime: item.update_time && dateToString(item.update_time, "day"),
      }}
      extra={<Space size={0}>{item.group?.group_name ? <Tag color="pink">{item.group.group_name}</Tag> : null}</Space>}
      footer={<></>}
    >
      <div>
        <PostContent text={item.content_text} textStruct={item.content_text_structure} media={item.media} />
      </div>
    </PinkPostCard>
  );
}

export type PostCommentReviewCardProps = {
  item: PostCommentReviewTarget;
  moreMenus?: MenuProps["items"];
};

export function PostCommentReviewCard(props: PostCommentReviewCardProps) {
  const { item, moreMenus } = props;
  const data = useMemo((): Map<number, PostCommentNode> => {
    const node: PostCommentNode = {
      ...item,
      key: item.comment_id,
      create_time_str: dateToString(item.create_time * 1000, "second"),
    };
    const map = new Map<number, PostCommentNode>();
    map.set(node.comment_id, node);
    return map;
  }, [item]);
  return (
    <div>
      <Typography.Text>审核用户的评论:</Typography.Text>
      <CommentTree<PostCommentNode>
        style={{ border: "1px solid #999", padding: 14, borderRadius: 12, marginTop: 12 }}
        data={data}
        avatarRender={(node) => {
          return <Avatar size="small" icon={<UserOutlined />} />;
        }}
        headerRender={(node) => (
          <div e2e-comment-header-id={node.comment_id} className="e2e-post-comment-header">
            <CommentHeader node={node} />
          </div>
        )}
        contentRender={(node) => node.content_text}
      />
    </div>
  );
}
type PostCommentNode = PostCommentReviewTarget &
  CommentNode & {
    create_time_str: string;
  };

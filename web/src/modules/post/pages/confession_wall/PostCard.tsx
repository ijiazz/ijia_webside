import { Avatar, Button, Dropdown, MenuProps, Space, Tag, Tooltip } from "antd";
import { VLink } from "@/lib/components/VLink.tsx";
import { PostContent } from "../../components/PostContent.tsx";
import React from "react";
import { MoreOutlined, UserOutlined } from "@ant-design/icons";
import { PinkPostCard } from "../../components/PinkCard.tsx";
import { ExportOutlined, MessageOutlined } from "@ant-design/icons";
import { PostItemDto } from "@/api.ts";
import { useThemeToken } from "@/global-provider.tsx";
import { LikeButton } from "../../components/LikeButton.tsx";

export type PCardProps = {
  item: PostItemDto;
  moreMenus?: MenuProps["items"];
  onLike?: (postId: number, isCancel: boolean) => void;
  onOpenComment?: (postId: number) => void;
};

export function WallPostCard(props: PCardProps) {
  const { item, moreMenus, onLike, onOpenComment } = props;
  const theme = useThemeToken();
  const isAnonymous = item.config.is_anonymous;
  const author = item.author;
  const userName = isAnonymous ? (
    <Tag bordered={false} color={theme.colorTextSecondary}>
      匿名
    </Tag>
  ) : (
    author?.user_name || author?.user_id
  );

  return (
    <PinkPostCard
      icon={
        <VLink to={undefined} target="_blank">
          {isAnonymous ? (
            <Avatar icon={<UserOutlined />} />
          ) : (
            <Avatar src={author?.avatar_url}>{author?.user_id}</Avatar>
          )}
        </VLink>
      }
      header={{
        userName,
        ipLocation: item.ip_location,
        publishTime: item.publish_time,
        updateTime: item.update_time,
      }}
      extra={
        <Space size={0}>
          {item.group?.group_name ? <Tag color="pink">{item.group.group_name}</Tag> : null}
          {item.config.self_visible && <Tag>仅自己可见</Tag>}
          {item.status.is_reviewing && <Tag color="blue">审核中</Tag>}
          {item.status.review_pass === false && (
            <Tooltip title={item.status.reason}>
              <Tag color="red">审核不通过</Tag>
            </Tooltip>
          )}
          {item.curr_user && (
            <Dropdown menu={{ items: moreMenus }}>
              <Button className="e2e-post-item-extra-btn" type="text" icon={<MoreOutlined />}></Button>
            </Dropdown>
          )}
        </Space>
      }
      footer={
        <PostFooter
          commentCount={item.stat.comment_total}
          isReported={item.curr_user?.is_report}
          isLike={item.curr_user?.is_like}
          likeCount={item.stat.like_total}
          likeDisabled={!item.curr_user}
          onPostLike={(isCancel) => onLike?.(item.post_id, isCancel)}
          onOpenComment={() => onOpenComment?.(item.post_id)}
        />
      }
    >
      <div>
        <PostContent text={item.content_text} textStruct={item.content_text_structure} media={item.media} />
      </div>
    </PinkPostCard>
  );
}

function PostFooter(props: {
  onPostLike?: (isCancel: boolean) => void;
  likeCount?: number;
  likeDisabled?: boolean;
  isLike?: boolean;
  isReported?: boolean;

  onOpenComment?: () => void;
  commentCount?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
      }}
    >
      <VLink style={{ color: "inherit" }} target="_blank">
        <Tooltip title="详情页开发中，敬请期待">
          <Button
            className="e2e-post-item-detail-open"
            type="text"
            icon={<ExportOutlined />}
            disabled // TODO
            style={{ fontSize: 16, width: "100%" }}
          />
        </Tooltip>
      </VLink>
      <Button
        className="e2e-post-item-comment-open"
        style={{ fontSize: 16, width: "100%" }}
        icon={<MessageOutlined />}
        type="text"
        onClick={props.onOpenComment}
      >
        {props.commentCount}
      </Button>
      {props.isReported ? (
        <div style={{ fontSize: 16, width: "100%", textAlign: "center" }}>
          <Tag color="red" bordered={false}>
            已举报
          </Tag>
        </div>
      ) : (
        <LikeButton
          className="e2e-post-item-like-btn"
          disabled={props.likeDisabled}
          isLike={props.isLike}
          onTrigger={(isCancel) => props.onPostLike?.(isCancel)}
          style={{ fontSize: 16, width: "100%" }}
        >
          {props.likeCount}
        </LikeButton>
      )}
    </div>
  );
}

import { Avatar, Button, Dropdown, MenuProps, Space, Tag, Tooltip } from "antd";
import { VLink } from "@/lib/components/VLink.tsx";
import { PostContent } from "../post/PostContent.tsx";
import { MoreOutlined, UserOutlined } from "@ant-design/icons";
import { PinkPostCard } from "../../wall/-components/PinkCard.tsx";
import { ExportOutlined, MessageOutlined } from "@ant-design/icons";
import { ReviewStatus, Post } from "@/api.ts";
import { useThemeToken } from "@/provider/mod.tsx";
import { LikeButton } from "../LikeButton.tsx";

export type PCardProps = {
  item: Post;
  moreMenus?: MenuProps["items"];
  onLike?: (postId: number, isCancel: boolean) => void;
  onOpenComment?: (postId: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

export function WallPostCard(props: PCardProps) {
  const { item, moreMenus, onLike, onOpenComment, className, style } = props;
  const theme = useThemeToken();
  const author = item.author;
  const isAnonymous = !author;
  const userName = !author ? <Tag color={theme.colorTextSecondary}>匿名</Tag> : author.user_name || author.user_id;

  const { review, config } = item;
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
        <Space size={4}>
          {item.group?.group_name ? <Tag color="pink">{item.group.group_name}</Tag> : null}
          {config?.self_visible && <Tag>仅自己可见</Tag>}
          {review?.status === ReviewStatus.pending && <Tag color="blue">审核中</Tag>}
          {review?.status === ReviewStatus.rejected && <Tag color="red">审核不通过</Tag>}
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
      className={className}
      style={style}
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
      <VLink style={{ color: "inherit" }} target="_blank" aria-label="打开详情页">
        <Tooltip title="详情页开发中，敬请期待">
          <Button
            type="text"
            icon={<ExportOutlined />}
            disabled // TODO
            style={{ fontSize: 16, width: "100%" }}
          />
        </Tooltip>
      </VLink>
      <Button
        aria-label="打开评论"
        style={{ fontSize: 16, width: "100%" }}
        icon={<MessageOutlined />}
        type="text"
        onClick={props.onOpenComment}
      >
        {props.commentCount}
      </Button>
      {props.isReported ? (
        <div style={{ fontSize: 16, width: "100%", textAlign: "center" }}>
          <Tag color="red">已举报</Tag>
        </div>
      ) : (
        <LikeButton
          aria-label="点赞或取消点击"
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

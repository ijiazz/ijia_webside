import { Button, Dropdown, MenuProps, Tag, Typography } from "antd";
import { CaretRightOutlined, DeleteOutlined, MoreOutlined, WarningOutlined } from "@ant-design/icons";
import { css, cx } from "@emotion/css";
import { PostCommentNode } from "./api.ts";

const { Text } = Typography;

type PostHeaderProps = {
  node: Pick<PostCommentNode, "comment_id" | "reply_to" | "curr_user"> & { user?: { user_name: string } };
  className?: string;
  onDelete?: () => void;
  onReport?: () => void;
};
export function CommentHeader(props: PostHeaderProps) {
  const { node, onDelete, onReport, className } = props;
  const menus: MenuProps["items"] = [];
  if (node.curr_user) {
    if (node.curr_user.can_update) {
      menus.unshift({
        label: "删除",
        icon: <DeleteOutlined />,
        key: "delete",
        onClick: onDelete,
      });
    }
    menus.push({
      label: node.curr_user.is_report ? "已举报" : "举报",
      icon: <WarningOutlined />,
      key: "report",
      disabled: node.curr_user.is_report,
      onClick: onReport,
    });
  }
  return (
    <div className={cx(PostCommentHeaderCSS, className)}>
      <Text className={PostCommentHeaderTextCSS} type="secondary">
        <span>{node.user?.user_name}</span>
        {node.reply_to && (
          <>
            <CaretRightOutlined />
            <span>{node.reply_to.user.user_name}</span>
            {node.reply_to.is_deleted && <Tag style={{ marginLeft: 4 }}>已删除2</Tag>}
          </>
        )}
      </Text>
      <div>
        {menus.length ? (
          <Dropdown rootClassName="e2e-comment-more-operation" menu={{ items: menus }}>
            <Button icon={<MoreOutlined />} type="text" />
          </Dropdown>
        ) : undefined}
      </div>
    </div>
  );
}
const PostCommentHeaderTextCSS = css`
  margin-top: 2px;
  > span {
    vertical-align: middle;
  }
`;
const PostCommentHeaderCSS = css`
  display: flex;
  justify-content: space-between;
`;

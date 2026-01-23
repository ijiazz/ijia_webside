import { Button, Dropdown, MenuProps, Tag, Typography } from "antd";
import React from "react";
import { CaretRightOutlined, DeleteOutlined, MoreOutlined, WarningOutlined } from "@ant-design/icons";
import styled from "@emotion/styled";
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
    <PostCommentHeaderCSS className={className}>
      <div>
        <PostCommentHeaderTextCSS type="secondary">
          <span>{node.user?.user_name}</span>
          {node.reply_to && (
            <>
              <CaretRightOutlined />
              <span>{node.reply_to.user.user_name}</span>
              {node.reply_to.is_deleted && <Tag style={{ marginLeft: 4 }}>已删除2</Tag>}
            </>
          )}
        </PostCommentHeaderTextCSS>
      </div>
      <div>
        {menus.length ? (
          <Dropdown rootClassName="e2e-comment-more-operation" menu={{ items: menus }}>
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

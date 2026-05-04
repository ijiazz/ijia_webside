import { Alert, Button, Dropdown, Space, Tag } from "antd";
import { ExamUserQuestion, ReviewStatus } from "@/api.ts";
import { QuestionWork } from "@/routes/_school/-components/question/QuestionWork.tsx";
import { DeleteOutlined, EditOutlined, MoreOutlined } from "@ant-design/icons";

type QuestionCardProps = {
  data: ExamUserQuestion;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};
export function QuestionCard(props: QuestionCardProps) {
  const { data: item, canManage, onDelete, onEdit } = props;
  const review = item.review;

  return (
    <QuestionWork
      data={item}
      className="e2e-question-card"
      e2e-question-id={item.question_id}
      extra={
        <Space wrap>
          {review?.status === ReviewStatus.pending && <Tag color="blue">审核中</Tag>}
          {review?.status === ReviewStatus.rejected && <Tag color="red">审核不通过</Tag>}
          {review?.status === ReviewStatus.passed && <Tag color="green">审核通过</Tag>}
          {canManage && (
            <Dropdown
              menu={{
                items: [
                  { icon: <EditOutlined />, label: "编辑", key: "edit", onClick: onEdit },
                  { icon: <DeleteOutlined />, label: "删除", key: "delete", onClick: onDelete },
                ],
              }}
            >
              <Button
                className="e2e-post-item-extra-btn"
                type="text"
                aria-label="题目更多操作"
                icon={<MoreOutlined />}
              ></Button>
            </Dropdown>
          )}
        </Space>
      }
    >
      {review?.status === ReviewStatus.rejected && review.comment && (
        <Alert type="warning" showIcon title={`驳回原因：${review.comment}`} />
      )}
    </QuestionWork>
  );
}

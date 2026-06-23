import { deleteExamination } from "@/request/examination.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { useModal } from "@/components/Modal/static.tsx";
import { ExaminationInfoResult, ExaminationStatus } from "@ijia/api-types";
import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Empty, List, Space, Tag, Typography } from "antd";

export type ExaminationListProps = {
  canManage?: boolean;
  className?: string;
  data?: ExaminationInfoResult[];
  onDeleted?: (examId: string) => void;
};

export function ExaminationList(props: ExaminationListProps) {
  const { canManage = true, className, data: items = [], onDeleted } = props;
  const navigate = useNavigate();
  const modals = useModal();
  const message = useMessage();

  const onDelete = (item: ExaminationInfoResult) => {
    modals.confirm({
      title: "删除考试",
      children: `确定要删除“${item.title}”吗？删除后无法恢复。`,
      onOk: async () => {
        await deleteExamination(item.id);
        message.success("考试已删除");
        onDeleted?.(item.id);
      },
    });
  };

  return (
    <Card className={className}>
      {items.length === 0 ? (
        <Empty description="暂时还没有考试" />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="detail"
                  type="link"
                  style={{ paddingInline: 0 }}
                  onClick={() => navigate({ to: `/examination/$examId`, params: { examId: item.id } })}
                >
                  查看详情
                </Button>,
                ...(canManage
                  ? [
                      <Button
                        key="delete"
                        type="link"
                        danger
                        style={{ paddingInline: 0 }}
                        onClick={() => onDelete(item)}
                      >
                        删除
                      </Button>,
                    ]
                  : []),
              ]}
            >
              <Space orientation="vertical" size={4}>
                <Space wrap>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Tag color={STATUS_LABELS[item.status].color}>{STATUS_LABELS[item.status].label}</Tag>
                </Space>
                <Typography.Text type="secondary">题目数量：{item.question_number ?? 0}</Typography.Text>
                <Typography.Text type="secondary">
                  开始时间：{item.allow_time_start ? new Date(item.allow_time_start).toLocaleString() : "不限"}
                </Typography.Text>
                <Typography.Text type="secondary">
                  结束时间：{item.allow_time_end ? new Date(item.allow_time_end).toLocaleString() : "不限"}
                </Typography.Text>
              </Space>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

export const STATUS_LABELS: Record<ExaminationStatus, { label: string; color: string }> = {
  [ExaminationStatus.upcoming]: { label: "未开始", color: "default" },
  [ExaminationStatus.ready]: { label: "可开始", color: "blue" },
  [ExaminationStatus.ongoing]: { label: "进行中", color: "processing" },
  [ExaminationStatus.ended]: { label: "已结束", color: "orange" },
  [ExaminationStatus.result]: { label: "已出结果", color: "green" },
};

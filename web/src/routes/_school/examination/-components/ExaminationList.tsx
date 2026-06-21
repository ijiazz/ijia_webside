import { deleteExamination, EXAMINATION_QUERY_KEY_PREFIX, getExaminationListQueryOption } from "@/request/examination.ts";
import { queryClient } from "@/request/client.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { useModal } from "@/components/Modal/static.tsx";
import { ExaminationInfoResult, ExaminationStatus } from "@/api.ts";
import { css } from "@emotion/css";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Alert, Button, Card, Empty, Flex, List, Space, Spin, Tag, Typography } from "antd";

export type ExaminationListProps = {
  showHeader?: boolean;
  showCreateButton?: boolean;
  canManage?: boolean;
  className?: string;
};

export function ExaminationList(props: ExaminationListProps) {
  const { showHeader = true, showCreateButton = false, canManage = true, className } = props;
  const query = useQuery(getExaminationListQueryOption());
  const navigate = useNavigate();
  const modals = useModal();
  const message = useMessage();
  const deleteMutation = useMutation({
    mutationFn: (examId: string) => deleteExamination(examId),
    onSuccess: async () => {
      message.success("考试已删除");
      await queryClient.invalidateQueries({ queryKey: [EXAMINATION_QUERY_KEY_PREFIX, "list"] });
      await query.refetch();
    },
  });

  const onDelete = (item: ExaminationInfoResult) => {
    modals.confirm({
      title: "删除考试",
      children: `确定要删除“${item.title}”吗？删除后无法恢复。`,
      okButtonProps: { danger: true, loading: deleteMutation.isPending },
      onOk: () => deleteMutation.mutateAsync(item.id),
    });
  };

  if (query.isLoading) {
    return (
      <div className={className}>
        <Card>
          <Flex justify="center" align="center" style={{ minHeight: 180 }}>
            <Spin />
          </Flex>
        </Card>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className={className}>
        <Alert type="error" showIcon message="考试列表加载失败" description={String(query.error)} />
      </div>
    );
  }

  const items = query.data?.items ?? [];

  return (
    <div className={className}>
      {showHeader && (
        <Flex justify="space-between" align="center" gap={16} wrap>
          <div>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              我的考试
            </Typography.Title>
            <Typography.Text type="secondary">查看考试状态和作答进度。</Typography.Text>
          </div>
          {showCreateButton && (
            <Space>
              <Button type="primary" onClick={() => navigate({ to: "/examination/simulate" })}>
                模拟考试
              </Button>
            </Space>
          )}
        </Flex>
      )}

      {!showHeader && showCreateButton && (
        <Flex justify="end" align="center">
          <Button type="primary" onClick={() => navigate({ to: "/examination/simulate" })}>
            模拟考试
          </Button>
        </Flex>
      )}

      <Card>
        {items.length === 0 ? (
          <Empty description="暂时还没有考试" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={items}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key="detail" type="link" style={{ paddingInline: 0 }} onClick={() => navigate({ href: `/examination/${item.id}` })}>
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
                          loading={deleteMutation.isPending}
                        >
                          删除
                        </Button>,
                      ]
                    : []),
                ]}
              >
                <Space direction="vertical" size={4}>
                  <Space wrap>
                    <Typography.Text strong>{item.title}</Typography.Text>
                    <Tag color={STATUS_COLORS[item.status]}>{STATUS_LABELS[item.status]}</Tag>
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
    </div>
  );
}

export const STATUS_LABELS: Record<ExaminationStatus, string> = {
  [ExaminationStatus.upcoming]: "未开始",
  [ExaminationStatus.ready]: "可开始",
  [ExaminationStatus.ongoing]: "进行中",
  [ExaminationStatus.ended]: "已结束",
  [ExaminationStatus.result]: "已出结果",
};

export const STATUS_COLORS: Record<ExaminationStatus, string> = {
  [ExaminationStatus.upcoming]: "default",
  [ExaminationStatus.ready]: "blue",
  [ExaminationStatus.ongoing]: "processing",
  [ExaminationStatus.ended]: "orange",
  [ExaminationStatus.result]: "green",
};

export const ExaminationListPageCSS = css`
  max-width: 880px;
  margin: 0 auto;
  padding: 24px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;
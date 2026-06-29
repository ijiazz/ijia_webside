import { deleteExamination } from "@/request/examination.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { useModal } from "@/components/Modal/static.tsx";
import { ExaminationInfoOutput, ExaminationStatus } from "@ijia/api-types";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button, Card, Empty, Divider, Space, Tag, Typography } from "antd";
import { dateToString } from "@/common/date.ts";

export type ExaminationListProps = {
  data?: ExaminationInfoOutput[];
  onDeleted?: (examId: string) => void;
};

export function ExaminationList(props: ExaminationListProps) {
  const { data: items = [], onDeleted } = props;
  const modals = useModal();
  const message = useMessage();

  const onDelete = (item: ExaminationInfoOutput) => {
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
    <Card>
      <div>
        {items.map((item) => {
          return (
            <div key={item.id}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Space wrap>
                    <Typography.Text strong>{item.title}</Typography.Text>
                    <Tag color={STATUS_LABELS[item.status].color}>{STATUS_LABELS[item.status].label}</Tag>
                  </Space>
                  <Space>
                    <Link to="/examination/$examId" params={{ examId: item.id }}>
                      查看
                    </Link>
                    <Button type="link" danger style={{ paddingInline: 0 }} onClick={() => onDelete(item)}>
                      删除
                    </Button>
                  </Space>
                </div>
                <Space>
                  <span>
                    总分：<b>100</b>
                  </span>
                  &nbsp;&nbsp;
                  <span>
                    得分：<b>100</b>
                  </span>
                </Space>
                <div>
                  <Typography.Text type="secondary">允许考试时间：{getTimeRange(item)}</Typography.Text>
                </div>
              </div>
              <Divider size="small" />
            </div>
          );
        })}
        {items.length === 0 && <Empty />}
      </div>
    </Card>
  );
}
function getTimeRange(item: ExaminationInfoOutput): string {
  if (item.allow_time_start && item.allow_time_end) {
    return `${dateToString(item.allow_time_start, "minute")} - ${dateToString(item.allow_time_end, "minute")}`;
  } else if (item.allow_time_start) {
    return `${dateToString(item.allow_time_start, "minute")} - 不限`;
  } else if (item.allow_time_end) {
    return `不限 - ${dateToString(item.allow_time_end, "minute")}`;
  } else {
    return "不限";
  }
}
export const STATUS_LABELS: Record<ExaminationStatus, { label: string; color: string }> = {
  [ExaminationStatus.upcoming]: { label: "未开始", color: "default" },
  [ExaminationStatus.ready]: { label: "可开始", color: "blue" },
  [ExaminationStatus.ongoing]: { label: "进行中", color: "processing" },
  [ExaminationStatus.ended]: { label: "待出成绩", color: "orange" },
  [ExaminationStatus.result]: { label: "已出结果", color: "green" },
};

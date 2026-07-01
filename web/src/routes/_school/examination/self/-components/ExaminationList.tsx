import { deleteExamination } from "@/request/examination.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { useModal } from "@/components/Modal/static.tsx";
import { ExaminationInfoOutput } from "@ijia/api-types";
import { Link } from "@tanstack/react-router";
import { Button, Card, Empty, Divider, Space, Tag, Typography } from "antd";
import { getTimeRange, STATUS_LABELS } from "../../-utils/const.ts";

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
                    总分：<b>{}</b>
                  </span>
                  &nbsp;&nbsp;
                  <span>
                    得分：<b>{item.score}</b>
                  </span>
                </Space>
                <div>
                  <Typography.Text type="secondary">
                    允许考试时间：{getTimeRange(item.allow_time_start, item.allow_time_end)}
                  </Typography.Text>
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

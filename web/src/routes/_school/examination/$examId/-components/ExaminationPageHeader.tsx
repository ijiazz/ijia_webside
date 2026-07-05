import { ExaminationInfoOutput } from "@/api.ts";
import { Button, Card, Descriptions, Flex, Space, Tag, Typography } from "antd";
import { getTimeRange, STATUS_LABELS } from "../../-utils/const.ts";

type ExaminationPageHeaderProps = {
  exam: ExaminationInfoOutput;
  onBack: () => void;
};

export function ExaminationPageHeader(props: ExaminationPageHeaderProps) {
  const { exam, onBack } = props;

  return (
    <>
      <Flex justify="space-between" align="center" gap={16} wrap>
        <Space align="center">
          <Typography.Title level={3}>{exam.title}</Typography.Title>
          <Tag color={STATUS_LABELS[exam.status].color}>{STATUS_LABELS[exam.status].label}</Tag>
        </Space>

        <Button onClick={onBack}>返回</Button>
      </Flex>

      <Card style={{ width: "100%" }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="总分">{exam.total_score}</Descriptions.Item>
          <Descriptions.Item label="题目总数">{exam.question_number ?? 0}</Descriptions.Item>
          <Descriptions.Item label=" 允许考试时间">
            {getTimeRange(exam.allow_time_start, exam.allow_time_end)}
          </Descriptions.Item>
          <Descriptions.Item label="时间限制">
            {exam.use_time_total_limit ? Math.floor(exam.use_time_total_limit / 60) + " 分钟" : "不限"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
}

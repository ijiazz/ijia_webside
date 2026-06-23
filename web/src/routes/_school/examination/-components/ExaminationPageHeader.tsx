import { ExaminationInfoResult, ExaminationStatus } from "@/api.ts";
import { css } from "@emotion/css";
import { Button, Card, Descriptions, Flex, Space, Tag, Typography } from "antd";
import { STATUS_COLORS, STATUS_LABELS, formatDateTime } from "./ExaminationDisplay.ts";

type ExaminationPageHeaderProps = {
  exam: ExaminationInfoResult;
  loading: boolean;
  onBack: () => void;
  onStart: () => void;
  onEnd: () => void;
};

export function ExaminationPageHeader(props: ExaminationPageHeaderProps) {
  const { exam, loading, onBack, onStart, onEnd } = props;

  return (
    <>
      <Flex justify="space-between" align="start" gap={16} wrap>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            {exam.title}
          </Typography.Title>
          <Space wrap>
            <Tag color={STATUS_COLORS[exam.status]}>{STATUS_LABELS[exam.status]}</Tag>
            <Typography.Text type="secondary">题目数量：{exam.question_number ?? 0}</Typography.Text>
          </Space>
        </div>
        <Space>
          <Button onClick={onBack}>返回</Button>
          {exam.status === ExaminationStatus.ready && (
            <Button type="primary" onClick={onStart} loading={loading}>
              开始考试
            </Button>
          )}
          {exam.status === ExaminationStatus.ongoing && (
            <Button type="primary" onClick={onStart} loading={loading}>
              继续考试
            </Button>
          )}
          {exam.status === ExaminationStatus.ongoing && (
            <Button danger onClick={onEnd} loading={loading}>
              立即交卷
            </Button>
          )}
        </Space>
      </Flex>

      <Card className={SummaryCardCSS}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="考试名称">{exam.title}</Descriptions.Item>
          <Descriptions.Item label="允许开始时间">{formatDateTime(exam.allow_time_start)}</Descriptions.Item>
          <Descriptions.Item label="允许结束时间">{formatDateTime(exam.allow_time_end)}</Descriptions.Item>
          <Descriptions.Item label="题目总数">{exam.question_number ?? 0}</Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
}

const SummaryCardCSS = css`
  width: 100%;
`;

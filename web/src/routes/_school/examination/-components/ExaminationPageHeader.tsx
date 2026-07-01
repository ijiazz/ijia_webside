import { ExaminationInfoOutput, ExaminationStatus } from "@/api.ts";
import { Button, Card, Descriptions, Flex, Space, Tag, Typography } from "antd";
import { getTimeRange, STATUS_LABELS } from "../-utils/const.ts";
import { useMutation } from "@tanstack/react-query";
import { endExamination, startExamination } from "@/request/examination.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { Link, useNavigate } from "@tanstack/react-router";

type ExaminationPageHeaderProps = {
  exam: ExaminationInfoOutput;
  onBack: () => void;
};

export function ExaminationPageHeader(props: ExaminationPageHeaderProps) {
  const { exam, onBack } = props;
  const navigate = useNavigate();
  const message = useMessage();
  const examId = exam.id;
  const startMutation = useMutation({
    mutationFn: () => startExamination(examId),
    onSuccess: async () => {
      navigate({ to: `/examination/$examId/answer`, params: { examId } });
      message.success("考试已开始");
    },
  });

  const endMutation = useMutation({
    mutationFn: () => endExamination(examId),
    onSuccess: async () => {
      message.success("已交卷");
      navigate({ to: `/examination/$examId`, params: { examId }, replace: true });
    },
  });
  return (
    <>
      <Flex justify="space-between" align="center" gap={16} wrap>
        <Space>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            {exam.title}
          </Typography.Title>
          <Tag color={STATUS_LABELS[exam.status].color}>{STATUS_LABELS[exam.status].label}</Tag>
        </Space>
        <Space>
          <Button onClick={onBack}>返回</Button>
          {exam.status === ExaminationStatus.ready && (
            <Button type="primary" onClick={() => startMutation.mutate()} loading={startMutation.isPending}>
              开始考试
            </Button>
          )}
          {exam.status === ExaminationStatus.ongoing && (
            <Link to="/examination/$examId/answer" params={{ examId: exam.id }}>
              <Button type="primary">继续考试</Button>
            </Link>
          )}
          {exam.status === ExaminationStatus.ongoing && (
            <Button danger onClick={() => endMutation.mutate()} loading={endMutation.isPending}>
              立即交卷
            </Button>
          )}
        </Space>
      </Flex>

      <Card style={{ width: "100%" }}>
        <Space>
          <span>
            总分：<b>{exam.total_score}</b>
          </span>
          &nbsp;&nbsp;
          <span>
            得分：<b>{exam.score}</b>
          </span>
        </Space>
        <Descriptions column={1} size="small">
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

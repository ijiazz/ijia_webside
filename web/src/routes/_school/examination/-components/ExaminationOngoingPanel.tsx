import { QuestionWork } from "@/routes/_school/-components/question/QuestionWork.tsx";
import { ExaminationQuestionOutput } from "@/api.ts";
import { Button, Card, Checkbox, Empty, Flex, Progress, Space, Spin, Tag, Typography } from "antd";

type ExaminationOngoingPanelProps = {
  currentQuestion: ExaminationQuestionOutput["question"] | undefined;
  selectedAnswer: number[];
  currentAnswered: boolean;
  autoNext: boolean;
  loading: boolean;
  loadNextPending: boolean;
  progressPercent: number;
  remainingSeconds: number | null;
  currentElapsedSeconds: number;
  onSelectAnswer: (value: number[]) => void;
  onToggleAutoNext: (value: boolean) => void;
  onSubmitAnswer: (value: number[]) => void;
  onLoadNext: () => void;
};

export function ExaminationOngoingPanel(props: ExaminationOngoingPanelProps) {
  const {
    currentQuestion,
    selectedAnswer,
    currentAnswered,
    autoNext,
    loading,
    loadNextPending,
    progressPercent,
    remainingSeconds,
    currentElapsedSeconds,
    onSelectAnswer,
    onToggleAutoNext,
    onSubmitAnswer,
    onLoadNext,
  } = props;

  return (
    <Card>
      {currentQuestion === undefined ? (
        <Flex justify="center" align="center" style={{ minHeight: 180 }}>
          <Spin />
        </Flex>
      ) : currentQuestion === null ? (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Empty description="当前没有更多未提交题目，可以直接交卷" />
          <Progress percent={progressPercent} status="active" />
        </Space>
      ) : (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Flex justify="space-between" align="center" wrap gap={12}>
            <Space direction="vertical" size={6}>
              <Space wrap>
                <Tag color="processing">第 {currentQuestion.index + 1} 题</Tag>
                {remainingSeconds !== null && (
                  <Tag color={remainingSeconds === 0 ? "red" : "gold"}>剩余 {remainingSeconds} 秒</Tag>
                )}
              </Space>
              <Typography.Text type="secondary">
                开始作答时间：{new Date(currentQuestion.start_time).toLocaleString()}
              </Typography.Text>
            </Space>
            <Space direction="vertical" size={6} align="end">
              <Typography.Text strong>当前题目用时：{currentElapsedSeconds} 秒</Typography.Text>
              <Checkbox checked={autoNext} onChange={(event) => onToggleAutoNext(event.target.checked)}>
                提交后自动开始下一题
              </Checkbox>
            </Space>
          </Flex>
          <QuestionWork
            data={currentQuestion}
            value={selectedAnswer}
            onChange={currentAnswered ? undefined : onSelectAnswer}
          />
          <Space wrap>
            {!currentAnswered ? (
              <>
                <Button type="primary" loading={loading} onClick={() => onSubmitAnswer(selectedAnswer)}>
                  {autoNext ? "提交并进入下一题" : "提交答案"}
                </Button>
                <Button loading={loading} onClick={() => onSubmitAnswer([])}>
                  跳过此题
                </Button>
              </>
            ) : (
              <Button type="primary" loading={loadNextPending} onClick={onLoadNext}>
                下一题
              </Button>
            )}
          </Space>
        </Space>
      )}
    </Card>
  );
}

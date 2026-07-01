import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { answerExaminationQuestion, nextExaminationQuestionQueryOption } from "@/request/examination.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { Button, Card, Checkbox, Empty, Flex, Progress, Space, Tag, Typography } from "antd";
import { QuestionWork } from "../../-components/question/QuestionWork.tsx";
import { ExaminationQuestionOutput } from "@ijia/api-types";

export const Route = createLazyFileRoute("/_school/examination/$examId/answer")({
  component: () => {
    const { examId } = Route.useParams();
    const { data, refetch } = useSuspenseQuery(nextExaminationQuestionQueryOption(examId));
    return (
      <Card>
        {data.question ? (
          <RouteComponent question={data.question} onNext={() => refetch()} />
        ) : (
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            <Empty description="当前没有更多未提交题目，可以直接交卷" />
            <Progress percent={0} status="active" />
          </Space>
        )}
      </Card>
    );
  },
});

function RouteComponent(props: { question: NonNullable<ExaminationQuestionOutput["question"]>; onNext: () => void }) {
  const { question: question, onNext } = props;
  const { examId } = Route.useParams();

  const index = question.index;

  const message = useMessage();

  const [now, setNow] = useState(() => Date.now());
  const [selectedAnswer, setSelectedAnswer] = useState<number[]>([]);
  const [autoNext, setAutoNext] = useState(true);
  const [currentAnswered, setCurrentAnswered] = useState(false);

  const answerMutation = useMutation({
    mutationFn: (answer: number[]) => answerExaminationQuestion(examId, { index, answer }),
    onSuccess: async () => {
      message.success("提交成功");
      if (autoNext) {
        onNext();
      } else {
        setCurrentAnswered(true);
      }
    },
  });

  const remainingSeconds = useMemo(() => {
    if (!question.time_limit) return null;
    const startAt = new Date(question.start_time).getTime();
    const deadline = startAt + question.time_limit * 1000;
    return Math.max(0, Math.ceil((deadline - now) / 1000));
  }, [question.start_time, question.time_limit, now]);

  const currentElapsedSeconds = useMemo(() => {
    if (!question.start_time) return 0;
    return Math.max(0, Math.floor((now - new Date(question.start_time).getTime()) / 1000));
  }, [question.start_time, now]);

  useEffect(() => {
    if (!question.time_limit) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [question.start_time, question.time_limit]);
  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Flex justify="space-between" align="center" wrap gap={12}>
        <Space orientation="vertical" size={6}>
          <Space wrap>
            <Tag color="processing">第 {question.index + 1} 题</Tag>
            {remainingSeconds !== null && (
              <Tag color={remainingSeconds === 0 ? "red" : "gold"}>剩余 {remainingSeconds} 秒</Tag>
            )}
          </Space>
          <Typography.Text type="secondary">
            开始作答时间：{new Date(question.start_time).toLocaleString()}
          </Typography.Text>
        </Space>
        <Space orientation="vertical" size={6} align="end">
          <Typography.Text strong>当前题目用时：{currentElapsedSeconds} 秒</Typography.Text>
          <Checkbox checked={autoNext} onChange={(event) => setAutoNext(event.target.checked)}>
            提交后自动开始下一题
          </Checkbox>
        </Space>
      </Flex>
      <QuestionWork data={question} value={selectedAnswer} onChange={currentAnswered ? undefined : setSelectedAnswer} />
      <Space wrap>
        {!currentAnswered ? (
          <>
            <Button type="primary" onClick={() => answerMutation.mutate(selectedAnswer)}>
              {autoNext ? "提交并进入下一题" : "提交答案"}
            </Button>
            <Button onClick={() => answerMutation.mutate([])}>跳过此题</Button>
          </>
        ) : (
          <Button type="primary">下一题</Button>
        )}
      </Space>
    </Space>
  );
}

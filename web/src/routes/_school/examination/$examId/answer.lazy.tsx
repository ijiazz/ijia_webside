import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  answerExaminationQuestion,
  endExamination,
  getExaminationDetailQueryOption,
  nextExaminationQuestionQueryOption,
} from "@/request/examination.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { Button, Card, Checkbox, Empty, Progress, Space, Typography } from "antd";
import { QuestionWork } from "../../-components/question/QuestionWork.tsx";
import { ExaminationQuestionOutput, ExamQuestionType } from "@ijia/api-types";
import { useModal } from "@/components/Modal.ts";
import { queryClient } from "@/request/client.ts";
import { dateToTimeString } from "@/common/date.ts";

export const Route = createLazyFileRoute("/_school/examination/$examId/answer")({
  component: () => {
    const { examId } = Route.useParams();
    const { data, refetch } = useSuspenseQuery(nextExaminationQuestionQueryOption(examId));
    const modal = useModal();
    const navigate = useNavigate();
    const message = useMessage();

    const onEnd = () => {
      modal.confirm({
        title: "确认交卷？",
        async onOk() {
          await endExamination(examId);
          message.success("交卷成功");
          queryClient.invalidateQueries(getExaminationDetailQueryOption(examId));
          navigate({ to: "/examination/$examId", params: { examId } });
        },
      });
    };

    const question = data.question;
    return (
      <Card>
        {question ? (
          <RouteComponent question={question} onNext={() => refetch()} />
        ) : (
          <Space orientation="vertical" size={16}>
            <Empty description="当前没有更多未提交题目，可以直接交卷" />
            <Button onClick={onEnd}>交卷</Button>
          </Space>
        )}
      </Card>
    );
  },
});
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
function RouteComponent(props: { question: NonNullable<ExaminationQuestionOutput["question"]>; onNext: () => void }) {
  const { question: question, onNext } = props;
  const { examId } = Route.useParams();

  const index = question.index;

  const message = useMessage();

  const [selectedAnswer, setSelectedAnswer] = useState<number[]>([]);
  const [autoNext, setAutoNext] = useState(true);
  const [currentAnswered, setCurrentAnswered] = useState(false);
  const now = useNow();
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

  const { remainingSeconds, usedSeconds, present } = useMemo(() => {
    const startAt = new Date(question.start_time).getTime();
    const useMs = Math.max(0, Math.floor(now - startAt));
    if (!question.time_limit) return { usedSeconds: useMs };
    const timeLimit = question.time_limit * 1000;
    const remainingMs = Math.max(timeLimit - useMs, 0);
    return {
      present: 100 - Math.floor((useMs / timeLimit) * 100),
      remainingSeconds: Math.floor(remainingMs / 1000),
      usedSeconds: Math.floor(useMs / 1000),
    };
  }, [question.start_time, question.time_limit, now]);

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Checkbox checked={autoNext} onChange={(event) => setAutoNext(event.target.checked)}>
          提交后自动开始下一题
        </Checkbox>
        <Space align="center">
          <Typography.Text type="secondary">开始时间：{dateToTimeString(question.start_time)}</Typography.Text>
          {!question.time_limit && <Typography.Text strong>用时：{usedSeconds} 秒</Typography.Text>}
        </Space>
        {typeof present === "number" && (
          <Progress
            size="small"
            percent={present}
            style={{ flex: 1 }}
            status="active"
            format={() => remainingSeconds + "s"}
          />
        )}
      </div>

      <QuestionWork
        data={question}
        index={question.index}
        value={selectedAnswer}
        onChange={currentAnswered ? undefined : setSelectedAnswer}
      />
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

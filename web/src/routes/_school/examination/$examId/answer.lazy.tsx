import { createLazyFileRoute, useLoaderData, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  answerExaminationQuestion,
  endExamination,
  getExaminationDetailQueryOption,
  nextExaminationQuestionQueryOption,
} from "@/request/examination.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { Button, Card, Checkbox, Empty, Space } from "antd";
import { QuestionWork } from "../../-components/question/QuestionWork.tsx";
import { ExaminationQuestionOutput } from "@ijia/api-types";
import { useModal } from "@/components/Modal.ts";
import { queryClient } from "@/request/client.ts";
import { UseTime } from "./-components/UseTime.tsx";

export const Route = createLazyFileRoute("/_school/examination/$examId/answer")({
  component: RouteComponent,
});
function RouteComponent() {
  const { examId } = Route.useParams();
  const { examination } = useLoaderData({ from: "/_school/examination/$examId" });
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
        navigate({ to: "/examination/$examId", params: { examId }, replace: true });
      },
    });
  };

  const question = data.question;

  return (
    <div style={{ maxWidth: 750, margin: "auto", padding: "14px 8px" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>{examination.title}</h3>
          <span>
            {question && <span>第{(question?.index ?? 0) + 1}题，</span>}共 {examination.question_number} 题
          </span>
        </div>
      </Card>
      {question ? (
        <QuestionAnswer question={question} onNext={() => refetch()} key={question.index} />
      ) : (
        <Card>
          <Empty description="当前没有更多未提交题目，可以直接交卷" />
          <Button size="large" style={{ width: "100%", marginBlockStart: 16 }} type="primary" onClick={onEnd}>
            交卷
          </Button>
        </Card>
      )}
    </div>
  );
}
function QuestionAnswer(props: { question: NonNullable<ExaminationQuestionOutput["question"]>; onNext: () => void }) {
  const { question: question, onNext } = props;
  const { examId } = Route.useParams();

  const index = question.index;
  const message = useMessage();
  const modal = useModal();

  const [selectedAnswer, setSelectedAnswer] = useState<number[]>([]);
  const [currentAnswered, setCurrentAnswered] = useState(false);
  const [autoNext, setAutoNext] = useState(true);

  const answerMutation = useMutation({
    mutationFn: (answer: number[]) => answerExaminationQuestion(examId, { index, answer }),
    onSuccess: async () => {
      message.success("提交成功");
      if (autoNext) onNext();
      else setCurrentAnswered(true);
    },
  });
  const skipQuestion = () => {
    modal.confirm({
      title: "确认跳过此题？",
      onOk: async () => answerMutation.mutate([]),
    });
  };

  return (
    <div>
      <QuestionWork
        readOnly={false}
        data={question}
        index={question.index}
        value={selectedAnswer}
        onChange={currentAnswered ? undefined : setSelectedAnswer}
      />
      <Card>
        <UseTime question={question} currentAnswered={currentAnswered} />
        <div style={{ display: "flex", justifyContent: "end", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Checkbox checked={autoNext} onChange={(event) => setAutoNext(event.target.checked)}>
            提交后自动开始下一题
          </Checkbox>
          <Space>
            {!currentAnswered ? (
              <>
                <Button onClick={skipQuestion}>跳过此题</Button>
                <Button type="primary" onClick={() => answerMutation.mutate(selectedAnswer)}>
                  {autoNext ? "提交并进入下一题" : "提交答案"}
                </Button>
              </>
            ) : (
              <Button type="primary" onClick={onNext}>
                下一题
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}

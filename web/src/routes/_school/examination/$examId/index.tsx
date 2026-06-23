import {
  answerExaminationQuestion,
  endExamination,
  getExaminationDetailQueryOption,
  getExaminationRecordQueryOption,
  getExaminationResultQueryOption,
  nextExaminationQuestion,
  startExamination,
} from "@/request/examination.ts";
import { queryClient } from "@/request/client.ts";
import { getRecordAnchorId } from "../-components/ExaminationDisplay.ts";
import { ExaminationOngoingPanel } from "../-components/ExaminationOngoingPanel.tsx";
import { ExaminationPageHeader } from "../-components/ExaminationPageHeader.tsx";
import { ExaminationRecordSection } from "../-components/ExaminationRecordSection.tsx";
import { css } from "@emotion/css";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Alert, Card, Flex, Spin, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { ExaminationQuestionOutput, ExaminationStatus } from "@/api.ts";

export const Route = createFileRoute("/_school/examination/$examId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { examId } = Route.useParams();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const detail = useQuery(getExaminationDetailQueryOption(examId));
  const record = useQuery({
    ...getExaminationRecordQueryOption(examId),
    enabled: detail.data?.status === ExaminationStatus.ended || detail.data?.status === ExaminationStatus.result,
  });
  const result = useQuery({
    ...getExaminationResultQueryOption(examId),
    enabled: detail.data?.status === ExaminationStatus.result,
  });
  const [currentQuestion, setCurrentQuestion] = useState<ExaminationQuestionOutput["question"] | undefined>(undefined);
  const [selectedAnswer, setSelectedAnswer] = useState<number[]>([]);
  const [autoNext, setAutoNext] = useState(true);
  const [currentAnswered, setCurrentAnswered] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const refreshDetail = async () => {
    await queryClient.invalidateQueries({ queryKey: ["examination", "detail", examId] });
    await detail.refetch();
  };

  const loadNextMutation = useMutation({
    mutationFn: () => nextExaminationQuestion(examId),
    onSuccess: (response) => {
      setCurrentQuestion(response.question);
      setSelectedAnswer([]);
      setCurrentAnswered(false);
    },
  });
  const startMutation = useMutation({
    mutationFn: () => startExamination(examId),
    onSuccess: async () => {
      message.success("考试已开始");
      await refreshDetail();
      await loadNextMutation.mutateAsync();
    },
  });
  const answerMutation = useMutation({
    mutationFn: (answer: number[]) =>
      answerExaminationQuestion(examId, {
        index: currentQuestion!.index,
        answer,
      }),
    onSuccess: async () => {
      message.success("答案已提交");
      if (autoNext) {
        await loadNextMutation.mutateAsync();
      } else {
        setCurrentAnswered(true);
      }
      await refreshDetail();
    },
  });
  const endMutation = useMutation({
    mutationFn: () => endExamination(examId),
    onSuccess: async () => {
      message.success("已交卷");
      setCurrentQuestion(undefined);
      await refreshDetail();
      await record.refetch();
      await result.refetch();
    },
  });

  useEffect(() => {
    if (detail.data?.status !== ExaminationStatus.ongoing) return;
    if (currentQuestion !== undefined || loadNextMutation.isPending) return;
    void loadNextMutation.mutateAsync();
  }, [currentQuestion, detail.data?.status, loadNextMutation.isPending]);

  useEffect(() => {
    if (!currentQuestion?.time_limit) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [currentQuestion?.start_time, currentQuestion?.time_limit]);

  const remainingSeconds = useMemo(() => {
    if (!currentQuestion?.time_limit) return null;
    const startAt = new Date(currentQuestion.start_time).getTime();
    const deadline = startAt + currentQuestion.time_limit * 1000;
    return Math.max(0, Math.ceil((deadline - now) / 1000));
  }, [currentQuestion?.start_time, currentQuestion?.time_limit, now]);

  const currentElapsedSeconds = useMemo(() => {
    if (!currentQuestion?.start_time) return 0;
    return Math.max(0, Math.floor((now - new Date(currentQuestion.start_time).getTime()) / 1000));
  }, [currentQuestion?.start_time, now]);

  if (detail.isLoading) {
    return (
      <div className={PageCSS}>
        <Card>
          <Flex justify="center" align="center" style={{ minHeight: 220 }}>
            <Spin />
          </Flex>
        </Card>
      </div>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <div className={PageCSS}>
        <Alert type="error" showIcon message="考试详情加载失败" description={String(detail.error)} />
      </div>
    );
  }

  const exam = detail.data;
  const loading =
    startMutation.isPending || answerMutation.isPending || endMutation.isPending || loadNextMutation.isPending;
  const recordQuestions = record.data?.questions ?? [];
  const answeredCount = recordQuestions.filter((item) => (item.selected?.length ?? 0) > 0).length;
  const progressPercent = exam.question_number ? Math.round((answeredCount / exam.question_number) * 100) : 0;
  const onBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }
    navigate({ to: "/examination" });
  };
  const onScrollToRecord = (index: number) => {
    document.getElementById(getRecordAnchorId(index))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={PageCSS}>
      <ExaminationPageHeader
        exam={exam}
        loading={loading}
        onBack={onBack}
        onStart={() => {
          if (exam.status === ExaminationStatus.ongoing) {
            void loadNextMutation.mutateAsync();
            return;
          }
          startMutation.mutate();
        }}
        onEnd={() => endMutation.mutate()}
      />

      {exam.status === ExaminationStatus.upcoming && (
        <Alert type="info" showIcon message="考试暂未开始" description="请在允许开始时间之后进入考试。" />
      )}

      {exam.status === ExaminationStatus.ongoing && (
        <ExaminationOngoingPanel
          currentQuestion={currentQuestion}
          selectedAnswer={selectedAnswer}
          currentAnswered={currentAnswered}
          autoNext={autoNext}
          loading={loading}
          loadNextPending={loadNextMutation.isPending}
          progressPercent={progressPercent}
          remainingSeconds={remainingSeconds}
          currentElapsedSeconds={currentElapsedSeconds}
          onSelectAnswer={setSelectedAnswer}
          onToggleAutoNext={setAutoNext}
          onSubmitAnswer={(answer) => answerMutation.mutate(answer)}
          onLoadNext={() => loadNextMutation.mutate()}
        />
      )}

      {(exam.status === ExaminationStatus.ended || exam.status === ExaminationStatus.result) && (
        <ExaminationRecordSection
          status={exam.status}
          recordQuestions={recordQuestions}
          recordLoading={record.isLoading}
          recordError={record.error}
          resultData={result.data}
          onScrollToRecord={onScrollToRecord}
        />
      )}
    </div>
  );
}

const PageCSS = css`
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

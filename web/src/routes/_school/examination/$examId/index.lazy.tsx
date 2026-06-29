import { endExamination, getExaminationResultQueryOption, startExamination } from "@/request/examination.ts";
import { queryClient } from "@/request/client.ts";
import { getRecordAnchorId } from "../-components/ExaminationDisplay.ts";
import { ExaminationPageHeader } from "../-components/ExaminationPageHeader.tsx";
import { ExaminationRecordSection } from "../-components/ExaminationRecordSection.tsx";
import { css } from "@emotion/css";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, createLazyFileRoute, useLoaderData } from "@tanstack/react-router";
import { Alert, message } from "antd";
import { ExaminationStatus } from "@/api.ts";

export const Route = createLazyFileRoute("/_school/examination/$examId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { examDetail: detail } = useLoaderData({ from: "/_school/examination/$examId" });
  const { examId } = Route.useParams();
  const navigate = Route.useNavigate();
  const router = useRouter();

  const result = useQuery({
    ...getExaminationResultQueryOption(examId),
    enabled: detail.status === ExaminationStatus.result,
  });

  const refreshDetail = async () => {
    await queryClient.invalidateQueries({ queryKey: ["examination", "detail", examId] });
  };

  const startMutation = useMutation({
    mutationFn: () => startExamination(examId),
    onSuccess: async () => {
      message.success("考试已开始");
      await refreshDetail();
    },
  });

  const endMutation = useMutation({
    mutationFn: () => endExamination(examId),
    onSuccess: async () => {
      message.success("已交卷");
      await refreshDetail();
      await result.refetch();
    },
  });

  const exam = detail;
  const loading = startMutation.isPending || endMutation.isPending;

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
            return;
          }
          startMutation.mutate();
        }}
        onEnd={() => endMutation.mutate()}
      />

      {exam.status === ExaminationStatus.upcoming && (
        <Alert type="info" showIcon title="考试暂未开始" description="请在允许开始时间之后进入考试。" />
      )}

      {(exam.status === ExaminationStatus.ended || exam.status === ExaminationStatus.result) && (
        <ExaminationRecordSection
          examId={examId}
          status={exam.status}
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

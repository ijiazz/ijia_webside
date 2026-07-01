import { ExaminationPageHeader } from "../-components/ExaminationPageHeader.tsx";
import { ExaminationRecordSection } from "../-components/ExaminationRecordSection.tsx";
import { css } from "@emotion/css";
import { useRouter, createLazyFileRoute, useLoaderData } from "@tanstack/react-router";
import { Alert } from "antd";
import { ExaminationStatus } from "@/api.ts";

export const Route = createLazyFileRoute("/_school/examination/$examId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { examination: detail } = useLoaderData({ from: "/_school/examination/$examId" });
  const { examId } = Route.useParams();
  const navigate = Route.useNavigate();
  const router = useRouter();

  const exam = detail;

  const onBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }
    navigate({ to: "/examination" });
  };

  return (
    <div className={PageCSS}>
      <ExaminationPageHeader exam={exam} onBack={onBack} />

      {exam.status === ExaminationStatus.upcoming && (
        <Alert type="info" showIcon title="考试暂未开始" description="请在允许开始时间之后进入考试。" />
      )}

      {(exam.status === ExaminationStatus.ended || exam.status === ExaminationStatus.result) && (
        <ExaminationRecordSection examId={examId} status={exam.status} />
      )}
    </div>
  );
}

const PageCSS = css`
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 40px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

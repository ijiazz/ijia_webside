import { ExaminationPageHeader } from "./-components/ExaminationPageHeader.tsx";
import { ExaminationRecordSection } from "./-components/ExaminationRecordSection.tsx";
import { css } from "@emotion/css";
import { createLazyFileRoute, useLoaderData, Link } from "@tanstack/react-router";
import { Alert, Button } from "antd";
import { ExaminationStatus } from "@/api.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { endExamination, getExaminationDetailQueryOption, startExamination } from "@/request/examination.ts";
import { useModal } from "@/components/Modal.ts";
import { queryClient } from "@/request/client.ts";

export const Route = createLazyFileRoute("/_school/examination/$examId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { examination: exam } = useLoaderData({ from: "/_school/examination/$examId" });
  const { examId } = Route.useParams();
  const navigate = Route.useNavigate();
  const message = useMessage();
  const modal = useModal();

  const onBack = () => {
    navigate({ to: "/examination" });
  };
  const onStart = () => {
    modal.confirm({
      title: "确认开始考试",
      async onOk(e) {
        e.stopPropagation();
        await startExamination(examId);
        navigate({ to: `/examination/$examId/answer`, params: { examId } });
        queryClient.invalidateQueries(getExaminationDetailQueryOption(examId));
      },
    });
  };
  const onEnd = () => {
    modal.confirm({
      title: "确认立即交卷？",
      async onOk(e) {
        e.stopPropagation();
        await endExamination(examId);
        message.success("已交卷");
        await queryClient.invalidateQueries(getExaminationDetailQueryOption(examId));
      },
    });
  };
  return (
    <div className={PageCSS}>
      <ExaminationPageHeader exam={exam} onBack={onBack} />
      {exam.status === ExaminationStatus.ready && (
        <Button type="primary" size="large" onClick={onStart}>
          开始考试
        </Button>
      )}
      {exam.status === ExaminationStatus.ongoing && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1em" }}>
          <Link to="/examination/$examId/answer" params={{ examId: exam.id }}>
            <Button type="primary" size="large" style={{ width: "100%" }}>
              继续考试
            </Button>
          </Link>
          <Button danger size="large" onClick={onEnd}>
            立即交卷
          </Button>
        </div>
      )}
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

import { QuestionAnswer, QuestionWork } from "@/routes/_school/-components/question/QuestionWork.tsx";
import { ExaminationRecordQuestion, ExaminationStatus } from "@ijia/api-types";
import { css } from "@emotion/css";
import { Link } from "@tanstack/react-router";
import { Alert, Avatar, Button, Card, Collapse, Empty, Rate, Space, Statistic, Typography } from "antd";
import { clampDifficulty, getRecordStatus } from "../../-utils/status_color.ts";
import { useQuery } from "@tanstack/react-query";
import { getExaminationRecordQueryOption, getExaminationResultQueryOption } from "@/request/examination.ts";
import { useRef } from "react";
import { TextStruct } from "@/components/TextStructure.tsx";
import { formatTimeToString } from "@/common/time.ts";

type ExaminationRecordSectionProps = {
  status: ExaminationStatus.ended | ExaminationStatus.result;
  examId: string;
};

export function ExaminationRecordSection(props: ExaminationRecordSectionProps) {
  const { status, examId } = props;
  const { data: resultData } = useQuery({
    ...getExaminationResultQueryOption(examId),
    enabled: status === ExaminationStatus.result,
  });
  const { data } = useQuery(getExaminationRecordQueryOption(examId));
  const recordAnchorRefs = useRef<HTMLDivElement>(null);
  const onScrollToRecord = (index: number) => {
    const container = recordAnchorRefs.current;
    if (container) {
      const targetElement = container.children.item(index);

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };
  const recordQuestions = data?.questions ?? [];
  return (
    <>
      {status === ExaminationStatus.ended && (
        <Alert
          type="warning"
          showIcon
          title="考试已结束，等待结果开放"
          description="当前可以查看作答记录，但正确答案与成绩会在结果开放后展示。"
        />
      )}

      {status === ExaminationStatus.result && resultData && (
        <Card>
          <Space size="large" wrap>
            <Statistic title="成绩" value={resultData.grade} />
            <Statistic title="用时" value={formatTimeToString(resultData.effective_time_consumption, "ms")} />
            <Statistic title="正确" value={resultData.correct_number} />
            <Statistic title="部分正确" value={resultData.partially_correct_number} />
            <Statistic title="错误" value={resultData.wrong_number} />
            <Statistic title="未作答" value={resultData.unanswered_number} />
          </Space>
        </Card>
      )}

      {recordQuestions.length > 0 && (
        <div className={IndexBarCSS}>
          {recordQuestions.map((item) => {
            const { color } = getRecordStatus(item);
            return (
              <Button
                key={item.index}
                className={IndexButtonCSS}
                style={{ backgroundColor: color }}
                onClick={() => onScrollToRecord(item.index)}
              >
                {item.index + 1}
              </Button>
            );
          })}
        </div>
      )}

      <Card title="作答记录" ref={recordAnchorRefs}>
        {recordQuestions.map((item) => {
          return <RecordQuestionCard key={item.index} item={item} />;
        })}
        {!recordQuestions.length && <Empty description="暂无作答记录" />}
      </Card>
    </>
  );
}

function RecordQuestionCard({ item }: { item: ExaminationRecordQuestion }) {
  const { question } = item;

  return (
    <QuestionWork
      data={question ?? {}}
      index={item.index}
      value={item.selected}
      correctIndexes={question?.answer?.answer_index}
      readOnly
    >
      <QuestionAnswer
        questionType={question?.question_type}
        correctIndexes={question?.answer?.answer_index}
        selected={item.selected}
        isTimeout={item.isTimeout}
        score={item.score}
        useTime={item.use_time}
      />
      {question && (
        <>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <Typography.Text type="secondary">难度：</Typography.Text>
              <Rate style={{ lineHeight: 1 }} disabled count={5} value={clampDifficulty(question.difficulty_level)} />
            </div>
            <div>
              <Typography.Text type="secondary">出题人：</Typography.Text>
              {question.user ? (
                <Link to="/user/$userId/post" params={{ userId: question.user.user_id }} target="_blank">
                  <Space size="small" align="center">
                    <Avatar size="small" src={question.user.avatar_url}>
                      {question.user.nickname}
                    </Avatar>
                    {question.user.nickname}
                  </Space>
                </Link>
              ) : (
                <Avatar size="small">无</Avatar>
              )}
            </div>
          </div>
          {question.answer && (
            <Collapse size="small" ghost styles={{ header: { padding: 0 } }}>
              <Collapse.Panel header="答案解析" key="answer">
                <TextStruct
                  text={question.answer.explanation_text}
                  structure={question.answer.explanation_text_struct}
                />
              </Collapse.Panel>
            </Collapse>
          )}
        </>
      )}
    </QuestionWork>
  );
}

const IndexBarCSS = css`
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
`;

const IndexButtonCSS = css`
  min-width: 40px;
  color: #fff;
  border: none;
  box-shadow: none;
`;

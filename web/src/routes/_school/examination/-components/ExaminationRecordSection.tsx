import { QuestionWork } from "@/routes/_school/-components/question/QuestionWork.tsx";
import { ExaminationRecordQuestion, ExaminationStatus, ExamQuestionType } from "@ijia/api-types";
import { css } from "@emotion/css";
import { Link } from "@tanstack/react-router";
import { Alert, Avatar, Button, Card, Empty, Rate, Space, Statistic, Tag, Typography } from "antd";
import { clampDifficulty, getRecordStatus } from "../-utils/status_color.ts";
import { useQuery } from "@tanstack/react-query";
import { getExaminationRecordQueryOption, getExaminationResultQueryOption } from "@/request/examination.ts";
import { useRef } from "react";

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
            <Statistic title="总成绩" value={resultData.grade} />
            <Statistic title="总用时(秒)" value={Math.round(resultData.effective_time_consumption / 1000)} />
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
          return <RecordQuestionCard key={item.index} item={mock} />;
        })}
        {!recordQuestions.length && <Empty description="暂无作答记录" />}
      </Card>
    </>
  );
}
const mock: ExaminationRecordQuestion = {
  index: 0,
  selected: [0],
  score: 1,
  isTimeout: false,
  use_time: 10000,
  question: {
    question_id: "1",
    question_text: "这是一个测试题目",
    difficulty_level: 3,
    question_type: ExamQuestionType.SingleChoice,
    answer: {
      answer_index: [0],
      explanation_text: "这是一个测试题目的解析",
    },
    options: [{ text: "选项A" }, { text: "选项B" }, { text: "选项C" }],
    time_limit: 60,
    user: {
      user_id: "1",
      nickname: "测试用户",
      avatar_url: "https://example.com/avatar.png",
    },
    comment: {
      id: "1",
      total: 0,
    },
  },
};

function RecordQuestionCard({ item }: { item: ExaminationRecordQuestion }) {
  const { index, question } = item;
  if (!question) {
    return (
      <Card>
        <Typography.Text type="secondary">第 {item.index + 1} 题目不存在。</Typography.Text>
      </Card>
    );
  }
  const status = getRecordStatus(item);
  return (
    <QuestionWork
      data={question}
      index={item.index}
      value={item.selected ?? undefined}
      correctIndexes={question.answer?.answer_index}
    >
      <div>
        <Space wrap>
          <Typography.Text type="secondary">得分：{item.score}</Typography.Text>
          <Tag color={status.color}>{status.text}</Tag>
          <Typography.Text type="secondary">
            耗时：{item.use_time && Math.floor(item.use_time / 1000)}秒
          </Typography.Text>
          {item.isTimeout && <Tag color="red">超时</Tag>}
        </Space>
      </div>
      <div>
        <Space wrap align="center">
          <Typography.Text type="secondary">难度：</Typography.Text>
          <Rate disabled count={5} value={clampDifficulty(question.difficulty_level)} />
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
        </Space>
      </div>
    </QuestionWork>
  );
}

const IndexBarCSS = css`
  position: sticky;
  top: 8px;
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

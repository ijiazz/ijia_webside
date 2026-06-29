import { QuestionWork } from "@/routes/_school/-components/question/QuestionWork.tsx";
import { ExaminationRecordQuestion, ExaminationResultOutput, ExaminationStatus } from "@/api.ts";
import { css } from "@emotion/css";
import { Link } from "@tanstack/react-router";
import { Alert, Button, Card, Empty, Flex, List, Rate, Space, Spin, Statistic, Tag, Typography } from "antd";
import {
  clampDifficulty,
  formatUseTime,
  getRecordAnchorId,
  getRecordStatusColor,
  getRecordStatusText,
  getRecordTagColor,
} from "./ExaminationDisplay.ts";
import { useQuery } from "@tanstack/react-query";
import { getExaminationRecordQueryOption } from "@/request/examination.ts";

type ExaminationRecordSectionProps = {
  status: ExaminationStatus.ended | ExaminationStatus.result;
  onScrollToRecord: (index: number) => void;
  examId: string;
  resultData?: ExaminationResultOutput;
};

export function ExaminationRecordSection(props: ExaminationRecordSectionProps) {
  const { status, examId, resultData, onScrollToRecord } = props;
  const { data, isFetching } = useQuery({
    ...getExaminationRecordQueryOption(examId),
  });
  const recordQuestions = data?.questions ?? [];
  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
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
            <Statistic title="正确" value={resultData.correct_number} />
            <Statistic title="部分正确" value={resultData.partially_correct_number} />
            <Statistic title="错误" value={resultData.wrong_number} />
            <Statistic title="未作答" value={resultData.unanswered_number} />
            <Statistic title="总用时(秒)" value={Math.round(resultData.effective_time_consumption / 1000)} />
          </Space>
        </Card>
      )}

      {recordQuestions.length > 0 && (
        <div className={IndexBarCSS}>
          {recordQuestions.map((item) => {
            const color = getRecordStatusColor(item);
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

      <Card title="作答记录">
        {isFetching ? (
          <Flex justify="center" align="center" style={{ minHeight: 160 }}>
            <Spin />
          </Flex>
        ) : recordQuestions.length > 0 ? (
          <List
            dataSource={recordQuestions}
            renderItem={(item) => (
              <List.Item id={getRecordAnchorId(item.index)}>
                <RecordQuestionCard item={item} />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无作答记录" />
        )}
      </Card>
    </Space>
  );
}

function RecordQuestionCard({ item }: { item: ExaminationRecordQuestion }) {
  if (!item.question) {
    return (
      <Card style={{ width: "100%" }}>
        <Typography.Text type="secondary">第 {item.index + 1} 题已无可展示题面。</Typography.Text>
      </Card>
    );
  }

  return (
    <QuestionWork
      style={{ width: "100%" }}
      data={item.question}
      index={item.index}
      value={item.selected ?? []}
      correctIndexes={item.question.answer?.answer_index}
      className={RecordCardCSS}
    >
      <Space orientation="vertical" size={8} style={{ width: "100%" }}>
        <Space wrap>
          <Tag color={getRecordTagColor(item)}>{getRecordStatusText(item)}</Tag>
          <Tag color={item.isTimeout ? "red" : "default"}>{item.isTimeout ? "已超时" : "未超时"}</Tag>
          <Typography.Text type="secondary">得分：{item.score ?? "未评分"}</Typography.Text>
          <Typography.Text type="secondary">耗时：{formatUseTime(item.use_time)}</Typography.Text>
        </Space>
        <Space wrap>
          <Typography.Text type="secondary">难度：</Typography.Text>
          <Rate disabled count={5} value={clampDifficulty(item.question.difficulty_level)} />
          {item.question.user && (
            <Typography.Text type="secondary">
              出题人：
              <Link to="/user/$userId/post" params={{ userId: item.question.user.user_id }}>
                {item.question.user.nickname}
              </Link>
            </Typography.Text>
          )}
        </Space>
      </Space>
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

const RecordCardCSS = css`
  border-left: 4px solid var(--ant-colorBorderSecondary);
`;

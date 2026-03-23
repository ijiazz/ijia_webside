import { Alert, Card, Space, Tag, Typography } from "antd";
import { css } from "@emotion/css";
import { ExamQuestionType, ExamUserQuestion, ReviewStatus } from "@/api.ts";
import { useInfiniteLoad } from "@/lib/hook/infiniteLoad.ts";
import { LoaderIndicator, LoadMoreIndicator } from "@/components/LoadMoreIndicator.tsx";
import { useElementOverScreen } from "@/lib/hook/observer.ts";
import { useEffect } from "react";
import { dateToString } from "@/common/date.ts";
import { getUserQuestionList } from "@/request/question.ts";

type UserQuestionListProps = {
  userId: number;
  canManage?: boolean;
};

export function UserQuestionList(props: UserQuestionListProps) {
  const { userId, canManage } = props;
  const { data, reset, next, previous } = useInfiniteLoad<ExamUserQuestion[], string>({
    async load(cursor, forward) {
      const result = await getUserQuestionList({ cursor });
      const items = forward ? result.items.slice().reverse() : result.items;
      return {
        items,
        nextParam: result.cursor_next ? result.cursor_next : undefined,
        prevParam: result.cursor_prev ? result.cursor_prev : undefined,
      };
    },
    init: () => [],
    mergeBack: (prev, nextItems) => (nextItems.length ? prev.concat(nextItems) : prev),
    mergeFront: (prev, nextItems) => (nextItems.length ? nextItems.reverse().concat(prev) : prev),
  });

  const { ref } = useElementOverScreen({
    onChange: (visible) => {
      if (visible) next.loadMore();
    },
    defaultVisible: true,
  });

  useEffect(() => {
    reset();
    next.loadMore();
  }, [userId]);

  return (
    <div className={listCss}>
      {previous.loading && <LoaderIndicator>加载中...</LoaderIndicator>}
      <div className={stackCss}>
        {data.map((item) => {
          const review = item.review;
          return (
            <Card
              key={item.question_id}
              title={
                <div className={titleRowCss}>
                  <Typography.Text strong>{item.question_text}</Typography.Text>
                  <Space wrap>
                    <Tag color="geekblue">{questionTypeLabel[item.question_type]}</Tag>
                    {review?.status === ReviewStatus.pending && <Tag color="blue">审核中</Tag>}
                    {review?.status === ReviewStatus.rejected && <Tag color="red">审核不通过</Tag>}
                    {review?.status === ReviewStatus.passed && <Tag color="green">审核通过</Tag>}
                  </Space>
                </div>
              }
              extra={<time>{item.update_time ? dateToString(item.update_time, "minute") : ""}</time>}
            >
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                <div>
                  <Typography.Text type="secondary">选项</Typography.Text>
                  <ol className={optionListCss}>
                    {(item.options ?? []).map((option, index) => {
                      const isAnswer = item.answer_index?.includes(index);
                      return (
                        <li key={index}>
                          <Tag color={isAnswer ? "green" : "default"}>{String.fromCharCode(65 + index)}</Tag>
                          <span>{option.text}</span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <div>
                  <Typography.Text type="secondary">解析</Typography.Text>
                  <Typography.Paragraph style={{ margin: "4px 0 0" }}>{item.answer_text}</Typography.Paragraph>
                </div>
                <div className={metaRowCss}>
                  <span>创建于 {dateToString(item.create_time, "minute")}</span>
                  <span>评论 {item.comment.total}</span>
                </div>
                {canManage && review?.status === ReviewStatus.rejected && review.comment && (
                  <Alert type="warning" showIcon title={`驳回原因：${review.comment}`} />
                )}
              </Space>
            </Card>
          );
        })}
      </div>
      <LoadMoreIndicator
        error={!!next.error}
        hasMore={next.hasMore}
        loading={next.loading}
        isEmpty={data.length === 0}
        onLoad={() => next.loadMore()}
        ref={ref}
      />
    </div>
  );
}

const questionTypeLabel: Record<ExamQuestionType, string> = {
  [ExamQuestionType.SingleChoice]: "单选题",
  [ExamQuestionType.MultipleChoice]: "多选题",
  [ExamQuestionType.TrueOrFalse]: "判断题",
};

const listCss = css`
  max-width: 760px;
  margin: 0 auto;
  padding: 0 12px 12px;
  height: 100%;
  overflow: auto;

  @media (max-width: 700px) {
    padding: 0 6px 12px;
  }
`;

const stackCss = css`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const titleRowCss = css`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;

  @media (max-width: 700px) {
    flex-direction: column;
  }
`;

const optionListCss = css`
  margin: 6px 0 0;
  padding-left: 20px;

  li {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 6px;
  }
`;

const metaRowCss = css`
  display: flex;
  gap: 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
`;

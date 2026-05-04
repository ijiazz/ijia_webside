import { Spin } from "antd";
import { css } from "@emotion/css";
import { ExamUserQuestion, ReviewStatus } from "@/api.ts";
import { useInfiniteLoad } from "@/lib/hook/infiniteLoad.ts";
import { LoaderIndicator, LoadMoreIndicator } from "@/components/LoadMoreIndicator.tsx";
import { useElementOverScreen } from "@/lib/hook/observer.ts";
import { useEffect } from "react";
import { getUserQuestionListQueryOption } from "@/request/question.ts";
import { QuestionCard } from "./QuestionCard.tsx";
import { useModal } from "@/components/Modal.ts";
import { api } from "@/request/client.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { useNavigate } from "@tanstack/react-router";

type UserQuestionListProps = {
  userId: number;
  canManage?: boolean;
};

export function UserQuestionList(props: UserQuestionListProps) {
  const { userId, canManage } = props;
  const { data, setData, reset, next, previous } = useInfiniteLoad<ExamUserQuestion[], string>({
    async load(cursor, forward) {
      const result = await getUserQuestionListQueryOption({ cursor, userId });
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
  const modals = useModal();
  const message = useMessage();
  const navigate = useNavigate();
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

  const onDelete = (item: ExamUserQuestion) => {
    modals.confirm({
      title: "删除确认",
      children:
        item.review?.status === ReviewStatus.passed
          ? `确定要删除吗？审核通过的题目无法彻底删除，删除操作只是将题目从用户列表移动到公共题库`
          : "确定要删除吗？",
      onOk: async () => {
        await api["/question/entity/:question_id"].delete({ params: { question_id: item.question_id } });
        message.success("已删除");
        setData((prev) => prev.filter((i) => i.question_id !== item.question_id));
      },
      okButtonProps: { danger: true },
    });
  };

  return (
    <div>
      {previous.loading && (
        <LoaderIndicator>
          <Spin size="small" />
        </LoaderIndicator>
      )}
      <div className={listCSS}>
        {data.map((item) => {
          return (
            <QuestionCard
              key={item.question_id}
              data={item}
              canManage={canManage}
              onEdit={() =>
                navigate({
                  to: "/question/edit/$questionId",
                  params: { questionId: item.question_id },
                })
              }
              onDelete={() => onDelete(item)}
            />
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

const listCSS = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-block: 12px;
`;

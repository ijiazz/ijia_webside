import {
  CommitQuestionReviewParam,
  CommitReviewResult,
  ExamQuestionType,
  QuestionPublic,
  ReviewTargetType,
} from "@/api.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { api } from "@/request/client.ts";
import { getReviewNextQueryOption } from "@/request/review.ts";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Button, Empty, Space, Spin, Tag, Typography } from "antd";
import { FormProvider, useForm } from "react-hook-form";
import { ResultRadioField } from "./form/ResultRadioField.tsx";
import { FormValues } from "./form/schema.ts";
import { ReviewItem } from "../-components/ReviewItem.tsx";
import * as styles from "./comment.css.ts";
import { getQuestionDetail } from "@/request/question.ts";
import { EditQuestionFields, EditQuestionFormFields } from "../../-components/question/EditQuestionFields.tsx";

type QuestionFormValues = FormValues & EditQuestionFormFields;
type QuestionInfo = {
  target_id: number;
};

export function QuestionReview() {
  const message = useMessage();
  const form = useForm<QuestionFormValues>();

  const {
    data: initData,
    isFetching,
    refetch,
  } = useSuspenseQuery(getReviewNextQueryOption<QuestionInfo>({ type: ReviewTargetType.exam_question }));
  const { data, mutateAsync } = useMutation({
    mutationFn(param: CommitQuestionReviewParam) {
      return api["/review/commit/question"].post({ body: param }) as Promise<CommitReviewResult<QuestionInfo>>;
    },
    onSuccess(res) {
      if (res.success) message.success("审核成功");
      else message.info("操作已被忽略");
    },
  });

  const reviewData = data ? data.next : initData.item;

  const questionId = reviewData?.info.target_id;
  if (!reviewData || !questionId) {
    return (
      <Empty
        description={
          <div>
            没有待审核的题目
            <Button type="link" onClick={() => refetch()} loading={isFetching}>
              刷新
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div style={styles.pageStyle}>
      <Typography.Title style={{ margin: 0 }} level={4}>
        内容审核
      </Typography.Title>
      <ReviewItem item={reviewData} />

      <FormProvider {...form}>
        <form
          style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          onSubmit={form.handleSubmit(async (values) => {
            const { isPass, remark, question_type, ...updates } = values;

            const body: CommitQuestionReviewParam = {
              review_id: reviewData.id.toString(),
              is_passed: values.isPass,
              remark: values.remark,
              update: updates,
            };
            return mutateAsync(body);
          })}
        >
          <QuestionReviewInfoPanel questionId={questionId.toString()} />
          <ResultRadioField />
        </form>
      </FormProvider>
    </div>
  );
}

function QuestionReviewInfoPanel(props: { questionId: string }) {
  const { questionId } = props;
  const { data: question, error, isLoading } = useQuery(getQuestionDetail(questionId));

  if (isLoading) return <Spin />;
  if (!question) {
    return <Empty description="题目信息不存在" />;
  }
  return <EditQuestionFields mode="edit" />;
}

import { CommitQuestionReviewParam, CommitReviewResult, ReviewTargetType } from "@/api.ts";
import { useMessage } from "@/provider/AntdProvider.tsx";
import { api, queryClient } from "@/request/client.ts";
import { getReviewNextQueryOption } from "@/request/review.ts";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Button, Empty, Typography } from "antd";
import { FormProvider, useForm } from "react-hook-form";
import { ResultRadioField } from "./form/ResultRadioField.tsx";
import { ReviewItem } from "../-components/ReviewItem.tsx";
import * as styles from "./comment.css.ts";
import { getQuestionDetailForReview } from "@/request/question.ts";
import {
  EditQuestionFields,
  EditQuestionFormFields,
  QuestionEditMode,
} from "../../-components/question/EditQuestionFields.tsx";

type QuestionFormInput = Partial<EditQuestionFormFields>;
type QuestionFormOutput = EditQuestionFormFields;

type QuestionInfo = {
  target_id: number;
};

export function QuestionReview() {
  const message = useMessage();
  const {
    data: initData,
    isFetching,
    refetch,
  } = useSuspenseQuery(getReviewNextQueryOption<QuestionInfo>({ type: ReviewTargetType.exam_question }));

  const updateForm = useForm<QuestionFormInput, undefined, EditQuestionFormFields>({
    defaultValues: async () => {
      const questionId = initData.item?.info.target_id;
      if (questionId === undefined) {
        return {};
      }
      const questionDetail = await queryClient.fetchQuery(getQuestionDetailForReview(questionId.toString()));
      return questionDetail;
    },
  });

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

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <FormProvider {...updateForm}>
          <EditQuestionFields mode={QuestionEditMode.FullEdit} />
        </FormProvider>
        <ResultRadioField
          onSubmit={async (values) => {
            const questionFormValues = await new Promise<QuestionFormOutput>((resolve) =>
              updateForm.handleSubmit(async (formValues) => {
                resolve(formValues);
              })(),
            );

            const body: CommitQuestionReviewParam = {
              review_id: reviewData.id.toString(),
              is_passed: values.isPass,
              remark: values.remark,
              update: questionFormValues,
            };
            await mutateAsync(body);
          }}
        />
      </div>
    </div>
  );
}

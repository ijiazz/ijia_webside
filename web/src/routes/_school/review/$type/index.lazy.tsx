import { createLazyFileRoute } from "@tanstack/react-router";

import { api } from "@/request/client.ts";
import { CommitReviewParam, ReviewTargetType } from "@/api.ts";
import { Button, Empty, Typography } from "antd";
import { useAntdStatic } from "@/provider/mod.tsx";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { getReviewNextQueryOption } from "@/request/review.ts";
import { ReviewItem } from "../-components/ReviewItem.tsx";
import type { RouteParam } from "./index.tsx";
import { FormValues } from "../-components/form/schema.ts";
import { ResultRadioField } from "../-components/form/ResultRadioField.tsx";
import * as styles from "../-components/comment.css.ts";
import { QuestionReview } from "../-components/question.tsx";

export const Route = createLazyFileRoute("/_school/review/$type/")({
  component: () => {
    const { type: reviewType } = Route.useParams() as RouteParam;
    if (reviewType === ReviewTargetType.exam_question) return <QuestionReview />;
    return <RouteComponent />;
  },
});

function RouteComponent() {
  const { message } = useAntdStatic();
  const { type: reviewType } = Route.useParams() as RouteParam;
  const form = useForm<FormValues>();
  const { data: initData, isFetching, refetch } = useSuspenseQuery(getReviewNextQueryOption({ type: reviewType }));

  const { data, mutateAsync } = useMutation({
    async mutationFn(param: CommitReviewParam) {
      return api["/review/commit/:type"].post({ params: { type: reviewType }, body: param });
    },
    onSuccess(data) {
      if (data.success) message.success("审核成功");
      else message.info("操作已被被忽略");
    },
  });
  const reviewData = data ? data.next : initData.item;

  if (!reviewData) {
    return (
      <Empty
        description={
          <div>
            没有待审核的内容
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
          onSubmit={form.handleSubmit((values) => {
            return mutateAsync({ review_id: reviewData.id, is_passed: values.isPass, remark: values.remark });
          })}
        >
          <ResultRadioField />
        </form>
      </FormProvider>
    </div>
  );
}
